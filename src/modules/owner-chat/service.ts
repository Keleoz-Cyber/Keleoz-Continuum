import type { AiMessage } from '@/modules/ai/provider'
import type { AiQuotaPolicy } from '@/modules/ai/quota'
import {
  buildAutoMemoryTail,
  parseAutoMemoryOperations,
  selectMemoryContext,
  type AutoMemoryOperation,
  type OwnerMemoryRecord,
} from '@/modules/owner-memory/contracts'

type Companion = {
  id: string
  name: string
  description: string
  systemPrompt: string
  enabled: boolean
  memoryEnabled: boolean
  autoMemoryEnabled: boolean
  autoMemoryMode: string
  autoMemoryBudget: number
}

type Thread = {
  id: string
  title: string
  archived: boolean
  companion: Companion
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

type AutoMemoryEntry = {
  id: string
  category: string
  priority: 'always' | 'normal' | 'low'
  content: string
  createdAt: Date
  updatedAt: Date
}

function autoMemoryInstructions(ownerName: string) {
  return [
    '【记忆系统】',
    `你可以维护一份关于${ownerName}的长期记忆档案。回复正文中可插入以下标签，系统会拦截执行且不会向 Owner 显示标签：`,
    '<mem_create category="分类" priority="优先级">记忆内容</mem_create>',
    '<mem_update id="条目id">修改后的完整内容</mem_update>',
    '<mem_delete id="条目id"/>',
    '分类：work_context｜personal_context｜top_of_mind｜brief_history｜long_term_background｜user_instructions。',
    '优先级：always（全档最多3条）｜normal｜low。',
    '提炼而非转录；不写闲聊和不稳定情绪，每轮最多3次操作，多数对话无需操作。',
  ].join('\n')
}

export function createOwnerChatService(dependencies: {
  repository: {
    getThread(id: string): Promise<Thread | null>
    listMemories(input: { companionId: string; now: Date }): Promise<OwnerMemoryRecord[]>
    listAutoMemories(companionId: string): Promise<AutoMemoryEntry[]>
    activateMemories(ids: string[], now: Date): Promise<void>
    applyAutoMemoryOperations(input: { companionId: string; authorName: string; operations: AutoMemoryOperation[]; now: Date }): Promise<Array<{ ok: boolean; label: string; detail: string }>>
    appendMessage(input: {
      threadId: string; role: 'user' | 'assistant'; content: string; promptTokens?: number; completionTokens?: number
      autoMemoryEvents?: Array<{ ok: boolean; label: string; detail: string }>; now: Date
    }): Promise<{ id: string }>
  }
  quota: {
    reserve(input: {
      feature: 'chat'; sourceHash: string; sessionId: string; provider: string; model: string
      inputCharacters: number; policy: AiQuotaPolicy; now: Date
    }): Promise<{ id: string }>
    complete(input: { id: string; outputCharacters: number; promptTokens: number; completionTokens: number; providerRequestId: string; completedAt: Date }): Promise<void>
    fail(input: { id: string; errorCode: string; completedAt: Date }): Promise<void>
  }
  provider: { complete(messages: AiMessage[]): Promise<{ content: string; truncated: boolean; providerRequestId: string; promptTokens: number; completionTokens: number }> }
  gate?: { tryAcquire(): (() => void) | null }
  providerName: string
  model: string
  maxOutputTokens: number
  dailyBudgetMicroUsd: number
  inputMicroUsdPerMillionTokens: number
  outputMicroUsdPerMillionTokens: number
  maxRequestsPerThread?: number
  maxRequestsPerOwnerDay?: number
}) {
  const policy: AiQuotaPolicy = {
    enabled: true,
    maxRequestsPerSourceDay: dependencies.maxRequestsPerOwnerDay ?? 500,
    maxRequestsPerSession: dependencies.maxRequestsPerThread ?? 200,
    cooldownSeconds: 0,
    dailyBudgetMicroUsd: dependencies.dailyBudgetMicroUsd,
    inputMicroUsdPerMillionTokens: dependencies.inputMicroUsdPerMillionTokens,
    outputMicroUsdPerMillionTokens: dependencies.outputMicroUsdPerMillionTokens,
    maxOutputTokens: dependencies.maxOutputTokens,
  }
  return {
    async send(input: { ownerId: string; threadId: string; content: string; now?: Date }) {
      const now = input.now ?? new Date()
      const content = input.content.trim()
      if (!content || content.length > 12_000) throw new Error('Chat message must contain 1-12000 characters')
      const thread = await dependencies.repository.getThread(input.threadId)
      if (!thread) throw new Error('Chat thread was not found')
      if (thread.archived) throw new Error('Chat thread is archived')
      if (!thread.companion.enabled) throw new Error('Chat companion is disabled')

      const [memories, autoMemories] = await Promise.all([
        thread.companion.memoryEnabled
          ? dependencies.repository.listMemories({ companionId: thread.companion.id, now })
          : Promise.resolve([]),
        thread.companion.autoMemoryEnabled
          ? dependencies.repository.listAutoMemories(thread.companion.id)
          : Promise.resolve([]),
      ])
      const memoryContext = selectMemoryContext(memories, {
        companionId: thread.companion.id,
        userMessage: content,
        now,
      })
      const autoTail = thread.companion.autoMemoryEnabled
        ? buildAutoMemoryTail(autoMemories, {
            queryText: content,
            mode: ['retrieval', 'hybrid', 'full'].includes(thread.companion.autoMemoryMode)
              ? thread.companion.autoMemoryMode as 'retrieval' | 'hybrid' | 'full'
              : 'hybrid',
            budget: thread.companion.autoMemoryBudget,
          })
        : ''
      const messages: AiMessage[] = [{
        role: 'system',
        content: [
          `你是 Keleoz Continuum 中 Owner 的私人 AI 同行者「${thread.companion.name}」。`,
          thread.companion.description,
          thread.companion.systemPrompt,
          '对话与记忆属于 Owner 私人空间，不得声称这些内容已经公开。',
          thread.companion.autoMemoryEnabled ? autoMemoryInstructions('Owner') : '',
        ].filter(Boolean).join('\n'),
      }]
      messages.push(...thread.messages.slice(-40).map((message) => ({ role: message.role, content: message.content })))
      const tail = [memoryContext.text, autoTail].filter(Boolean).join('\n\n')
      messages.push({ role: 'user', content: tail ? `${tail}\n\n【用户当前消息】\n${content}` : content })

      const reservation = await dependencies.quota.reserve({
        feature: 'chat', sourceHash: input.ownerId, sessionId: thread.id,
        provider: dependencies.providerName, model: dependencies.model,
        inputCharacters: messages.reduce((total, message) => total + message.content.length, 0), policy, now,
      })
      const release = dependencies.gate?.tryAcquire() ?? (dependencies.gate ? null : () => {})
      if (!release) {
        await dependencies.quota.fail({ id: reservation.id, errorCode: 'owner_chat_busy', completedAt: new Date() })
        throw new Error('Owner Chat is busy')
      }
      await dependencies.repository.appendMessage({ threadId: thread.id, role: 'user', content, now })
      try {
        const completion = await dependencies.provider.complete(messages)
        const parsed = parseAutoMemoryOperations(completion.content)
        const visibleReply = parsed.cleanText.trim() ? parsed.cleanText : '（已更新记忆）'
        const autoMemoryEvents = thread.companion.autoMemoryEnabled
          ? await dependencies.repository.applyAutoMemoryOperations({
              companionId: thread.companion.id,
              authorName: thread.companion.name,
              operations: parsed.operations,
              now,
            })
          : []
        await Promise.all([
          dependencies.repository.appendMessage({
            threadId: thread.id,
            role: 'assistant',
            content: visibleReply,
            promptTokens: completion.promptTokens,
            completionTokens: completion.completionTokens,
            autoMemoryEvents,
            now: new Date(),
          }),
          dependencies.repository.activateMemories(memoryContext.memoryIds, new Date()),
          dependencies.quota.complete({
            id: reservation.id,
            outputCharacters: completion.content.length,
            promptTokens: completion.promptTokens,
            completionTokens: completion.completionTokens,
            providerRequestId: completion.providerRequestId,
            completedAt: new Date(),
          }),
        ])
        return { content: visibleReply, autoMemoryEvents, truncated: completion.truncated }
      } catch (error) {
        await dependencies.quota.fail({ id: reservation.id, errorCode: 'owner_chat_failed', completedAt: new Date() })
        throw error
      } finally {
        release()
      }
    },
  }
}
