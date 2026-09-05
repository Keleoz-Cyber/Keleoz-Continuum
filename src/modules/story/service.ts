import { AiProviderError, type AiMessage } from '@/modules/ai/provider'
import type { AiQuotaPolicy } from '@/modules/ai/quota'
import {
  buildStoryDocumentMessages,
  buildStoryTurnSystemPrompt,
  type StoryGatewayRequest,
} from './contracts'

export class StoryUnavailableError extends Error {
  constructor() {
    super('Story AI unavailable')
    this.name = 'StoryUnavailableError'
  }
}
export class StoryBusyError extends Error {
  constructor() {
    super('Story AI busy')
    this.name = 'StoryBusyError'
  }
}

type ProviderResult = {
  content: string
  truncated: boolean
  providerRequestId: string
  promptTokens: number
  completionTokens: number
}

type Dependencies = {
  repository: {
    reserve(input: {
      feature: 'story'
      sourceHash: string
      sessionId: string
      provider: string
      model: string
      inputCharacters: number
      policy: AiQuotaPolicy
      now: Date
    }): Promise<{ id: string }>
    complete(input: {
      id: string
      outputCharacters: number
      promptTokens: number
      completionTokens: number
      providerRequestId: string
      completedAt: Date
    }): Promise<void>
    fail(input: { id: string; errorCode: string; completedAt: Date }): Promise<void>
  }
  turnProvider: { complete(messages: AiMessage[],signal?:AbortSignal): Promise<ProviderResult> }
  documentProvider: { complete(messages: AiMessage[],signal?:AbortSignal): Promise<ProviderResult> }
  turnPolicy: AiQuotaPolicy
  documentPolicy: AiQuotaPolicy
  gate: { tryAcquire(): (() => void) | null }
  providerName: string
  model: string
}

export function createStoryService(dependencies: Dependencies) {
  return {
    async complete(input: { request: StoryGatewayRequest; sourceHash: string; now: Date;signal?:AbortSignal }) {
      const documentMode = input.request.mode === 'document'
      const policy = documentMode ? dependencies.documentPolicy : dependencies.turnPolicy
      if (!policy.enabled) throw new StoryUnavailableError()
      const release = dependencies.gate.tryAcquire()
      if (!release) throw new StoryBusyError()

      let reservationId: string | null = null
      try {
        const messages: AiMessage[] = input.request.mode === 'document'
          ? buildStoryDocumentMessages(input.request)
          : [
              { role: 'system', content: buildStoryTurnSystemPrompt(input.request) },
              ...input.request.messages,
            ]
        const inputCharacters = messages.reduce((total, message) => total + message.content.length, 0)
        const reservation = await dependencies.repository.reserve({
          feature: 'story',
          sourceHash: input.sourceHash,
          sessionId: input.request.sessionId,
          provider: dependencies.providerName,
          model: dependencies.model,
          inputCharacters,
          policy,
          now: input.now,
        })
        reservationId = reservation.id

        const provider = documentMode ? dependencies.documentProvider : dependencies.turnProvider
        const result = await provider.complete(messages,input.signal)
        await dependencies.repository.complete({
          id: reservation.id,
          outputCharacters: result.content.length,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          providerRequestId: result.providerRequestId,
          completedAt: new Date(),
        })
        if(result.truncated&&(!documentMode||!result.content.trim()))throw new AiProviderError('output_truncated')
        return { content: result.content, truncated: result.truncated }
      } catch (error) {
        if (reservationId) {
          await dependencies.repository.fail({
            id: reservationId,
            errorCode: error instanceof AiProviderError ? error.code : 'provider_error',
            completedAt: new Date(),
          })
        }
        throw error
      } finally {
        release()
      }
    },
  }
}
