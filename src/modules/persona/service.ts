import type { AiMessage } from '@/modules/ai/provider'
import { AiProviderError } from '@/modules/ai/provider'
import { ownerDailyAiSession } from '@/modules/ai/daily-session'
import type { AiQuotaPolicy } from '@/modules/ai/quota'
import {
  assertPersonaCanPropose,
  parsePersonaAiProposal,
  personaReviewProposalSchema,
  type PersonaReviewProposal,
} from '@/modules/persona/contracts'

type PersonaRecord = {
  id: string
  name: string
  handle: string
  description: string
  systemPrompt: string
  enabled: boolean
  canPost: boolean
  canComment: boolean
  canRepost: boolean
  canUseImages: boolean
}

type GenerateInput = {
  personaId: string
  ownerId: string
  action: PersonaReviewProposal['action']
  targetEntryId: string | null
  targetCommentId: string | null
  targetContext: string | null
  now: Date
}

type ProviderResult = {
  content: string
  truncated: boolean
  providerRequestId: string
  promptTokens: number
  completionTokens: number
}

function proposalShell(input: GenerateInput): PersonaReviewProposal {
  return personaReviewProposalSchema.parse({
    action: input.action,
    content: 'permission-check',
    imagePrompt: null,
    targetEntryId: input.targetEntryId,
    targetCommentId: input.targetCommentId,
  })
}

function buildMessages(persona: PersonaRecord, input: GenerateInput): AiMessage[] {
  const actionLabel = {
    post: '一条独立动态', comment: '一条评论', reply: '一条回复', repost: '一条转发感想',
  }[input.action]
  const target = input.targetContext ? `\n参考内容：\n${input.targetContext.slice(0, 2_000)}` : ''
  return [
    {
      role: 'system',
      content: [
        `你是 Keleoz Continuum 中明确标记为 AI 的 Persona「${persona.name}」（@${persona.handle}）。`,
        persona.description,
        persona.systemPrompt,
        '你的输出只会进入 Owner 审核箱，不会自动公开。',
        '只返回一个 JSON 对象，不要 Markdown、代码围栏、XML 标签或执行指令。',
        'JSON 结构必须是 {"content":"1-800 字符正文","imagePrompt":null}。',
        persona.canUseImages
          ? '如确有必要，可把 imagePrompt 改为 1-500 字符的配图提案；配图仍需单独审核。'
          : 'imagePrompt 必须为 null。',
      ].filter(Boolean).join('\n'),
    },
    { role: 'user', content: `请起草${actionLabel}。${target}` },
  ]
}

export function createPersonaGenerationService(deps: {
  personas: {
    getPersona(id: string): Promise<PersonaRecord | null>
    createReview(input: { personaId: string; proposal: PersonaReviewProposal; now?: Date }): Promise<{ id: string; status: 'pending' | 'approved' | 'rejected' | 'deleted' }>
  }
  quota: {
    reserve(input: {
      feature: 'persona'; sourceHash: string; sessionId: string; provider: string; model: string
      inputCharacters: number; policy: AiQuotaPolicy; now: Date
    }): Promise<{ id: string }>
    complete(input: {
      id: string; outputCharacters: number; promptTokens: number; completionTokens: number
      providerRequestId: string; completedAt: Date
    }): Promise<void>
    fail(input: { id: string; errorCode: string; completedAt: Date }): Promise<void>
  }
  gate?: { tryAcquire(): (() => void) | null }
  provider: { complete(messages: AiMessage[]): Promise<ProviderResult> }
  providerName: string
  model: string
  maxOutputTokens: number
  dailyBudgetMicroUsd: number
  inputMicroUsdPerMillionTokens: number
  outputMicroUsdPerMillionTokens: number
}) {
  const policy: AiQuotaPolicy = {
    enabled: true,
    maxRequestsPerSourceDay: 100,
    maxRequestsPerSession: 100,
    cooldownSeconds: 0,
    dailyBudgetMicroUsd: deps.dailyBudgetMicroUsd,
    inputMicroUsdPerMillionTokens: deps.inputMicroUsdPerMillionTokens,
    outputMicroUsdPerMillionTokens: deps.outputMicroUsdPerMillionTokens,
    maxOutputTokens: deps.maxOutputTokens,
  }
  return {
    async generate(input: GenerateInput) {
      const persona = await deps.personas.getPersona(input.personaId)
      if (!persona) throw new Error('Persona was not found')
      assertPersonaCanPropose(persona, proposalShell(input))
      const messages = buildMessages(persona, input)
      const reservation = await deps.quota.reserve({
        feature: 'persona',
        sourceHash: input.ownerId,
        sessionId: ownerDailyAiSession(input.ownerId,input.now),
        provider: deps.providerName,
        model: deps.model,
        inputCharacters: messages.reduce((total, message) => total + message.content.length, 0),
        policy,
        now: input.now,
      })
      const release = deps.gate?.tryAcquire() ?? (deps.gate ? null : () => {})
      if (!release) {
        await deps.quota.fail({ id: reservation.id, errorCode: 'persona_busy', completedAt: new Date() })
        throw new Error('Persona AI is busy')
      }
      let completion:ProviderResult|null=null
      try {
        completion = await deps.provider.complete(messages)
        if(completion.truncated)throw new AiProviderError('output_truncated')
        const proposal = parsePersonaAiProposal(completion.content, {
          action: input.action,
          targetEntryId: input.targetEntryId,
          targetCommentId: input.targetCommentId,
        })
        assertPersonaCanPropose(persona, proposal)
        const review = await deps.personas.createReview({ personaId: persona.id, proposal, now: input.now })
        await deps.quota.complete({id:reservation.id,outputCharacters:completion.content.length,promptTokens:completion.promptTokens,completionTokens:completion.completionTokens,providerRequestId:completion.providerRequestId,completedAt:new Date()})
        return review
      } catch (error) {
        if(completion)await deps.quota.complete({id:reservation.id,outputCharacters:completion.content.length,promptTokens:completion.promptTokens,completionTokens:completion.completionTokens,providerRequestId:completion.providerRequestId,completedAt:new Date()})
        const errorCode = error instanceof Error && error.message.includes('JSON')
          ? 'invalid_persona_proposal'
          : 'persona_generation_failed'
        await deps.quota.fail({ id: reservation.id, errorCode, completedAt: new Date() })
        throw error
      } finally {
        release()
      }
    },
  }
}
