import { AiProviderError, type AiMessage } from '@/modules/ai/provider'
import type { AiQuotaPolicy } from '@/modules/ai/quota'
import { buildTeaSystemPrompt, type TeaGatewayRequest } from '@/modules/tea/contracts'

export class AiUnavailableError extends Error {
  constructor() {
    super('AI unavailable')
    this.name = 'AiUnavailableError'
  }
}

export class AiBusyError extends Error {
  constructor() {
    super('AI busy')
    this.name = 'AiBusyError'
  }
}

type Dependencies = {
  repository: {
    reserve(input: {
      feature: 'tea'
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
  provider: {
    complete(messages: AiMessage[]): Promise<{
      content: string
      providerRequestId: string
      promptTokens: number
      completionTokens: number
    }>
  }
  policy: AiQuotaPolicy
  gate: { tryAcquire(): (() => void) | null }
  providerName: string
  model: string
}

export function createTeaService(dependencies: Dependencies) {
  return {
    async complete(input: { request: TeaGatewayRequest; sourceHash: string; now: Date }) {
      if (!dependencies.policy.enabled) throw new AiUnavailableError()
      const release = dependencies.gate.tryAcquire()
      if (!release) throw new AiBusyError()

      let reservationId: string | null = null
      try {
        const messages: AiMessage[] = [
          {
            role: 'system',
            content: buildTeaSystemPrompt({
              drink: input.request.drink,
              dessert: input.request.dessert,
              isNight: input.request.isNight,
            }),
          },
          ...input.request.messages,
        ]
        const inputCharacters = messages.reduce((total, message) => total + message.content.length, 0)
        const reservation = await dependencies.repository.reserve({
          feature: 'tea',
          sourceHash: input.sourceHash,
          sessionId: input.request.sessionId,
          provider: dependencies.providerName,
          model: dependencies.model,
          inputCharacters,
          policy: dependencies.policy,
          now: input.now,
        })
        reservationId = reservation.id

        const result = await dependencies.provider.complete(messages)
        await dependencies.repository.complete({
          id: reservation.id,
          outputCharacters: result.content.length,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          providerRequestId: result.providerRequestId,
          completedAt: new Date(),
        })
        return { content: result.content }
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
