import { AiProviderError, type AiMessage } from '@/modules/ai/provider'
import type { AiQuotaPolicy } from '@/modules/ai/quota'
import { buildTarotProviderMessages, type TarotGatewayRequest } from './contracts'

export class TarotUnavailableError extends Error { constructor() { super('Tarot unavailable'); this.name = 'TarotUnavailableError' } }
export class TarotBusyError extends Error { constructor() { super('Tarot busy'); this.name = 'TarotBusyError' } }

type Dependencies = {
  repository: {
    reserve(input: { feature: 'tarot'; sourceHash: string; sessionId: string; provider: string; model: string; inputCharacters: number; policy: AiQuotaPolicy; now: Date }): Promise<{ id: string }>
    complete(input: { id: string; outputCharacters: number; promptTokens: number; completionTokens: number; providerRequestId: string; completedAt: Date }): Promise<void>
    fail(input: { id: string; errorCode: string; completedAt: Date }): Promise<void>
  }
  provider: { complete(messages: AiMessage[],signal?:AbortSignal): Promise<{ content: string; truncated?:boolean;providerRequestId: string; promptTokens: number; completionTokens: number }> }
  policy: AiQuotaPolicy
  gate: { tryAcquire(): (() => void) | null }
  providerName: string
  model: string
}

export function createTarotService(dependencies: Dependencies) {
  return { async complete(input: { request: TarotGatewayRequest; sourceHash: string; now: Date;signal?:AbortSignal }) {
    if (!dependencies.policy.enabled) throw new TarotUnavailableError()
    const release = dependencies.gate.tryAcquire()
    if (!release) throw new TarotBusyError()
    let reservationId: string | null = null
    try {
      const messages = buildTarotProviderMessages(input.request)
      const reservation = await dependencies.repository.reserve({
        feature: 'tarot', sourceHash: input.sourceHash, sessionId: input.request.sessionId,
        provider: dependencies.providerName, model: dependencies.model,
        inputCharacters: messages.reduce((sum, message) => sum + message.content.length, 0),
        policy: dependencies.policy, now: input.now,
      })
      reservationId = reservation.id
      const result = await dependencies.provider.complete(messages,input.signal)
      await dependencies.repository.complete({ id: reservation.id, outputCharacters: result.content.length,
        promptTokens: result.promptTokens, completionTokens: result.completionTokens,
        providerRequestId: result.providerRequestId, completedAt: new Date() })
      if(result.truncated)throw new AiProviderError('output_truncated')
      return { content: result.content }
    } catch (error) {
      if (reservationId) await dependencies.repository.fail({ id: reservationId,
        errorCode: error instanceof AiProviderError ? error.code : 'provider_error', completedAt: new Date() })
      throw error
    } finally { release() }
  } }
}
