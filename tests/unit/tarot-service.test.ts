import { describe, expect, it } from 'vitest'

import { createAiConcurrencyGate, type AiQuotaPolicy } from '@/modules/ai/quota'
import { createTarotService, TarotUnavailableError } from '@/modules/tarot/service'
import type { TarotGatewayRequest } from '@/modules/tarot/contracts'

const request: TarotGatewayRequest = {
  mode: 'reading', sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  spread: 'single', guide: false, cards: [{ cardId: 'major:11', reversed: false }],
}
const policy: AiQuotaPolicy = { enabled: true, maxRequestsPerSourceDay: 20, maxRequestsPerSession: 4,
  cooldownSeconds: 1, dailyBudgetMicroUsd: 100_000, inputMicroUsdPerMillionTokens: 200_000,
  outputMicroUsdPerMillionTokens: 800_000, maxOutputTokens: 600 }

describe('Tarot service', () => {
  it('reserves Tarot quota and sends only the server-built reading prompt', async () => {
    const calls: Array<{ kind: string; value: unknown }> = []
    const service = createTarotService({
      repository: {
        async reserve(value) { calls.push({ kind: 'reserve', value }); return { id: 'reservation' } },
        async complete(value) { calls.push({ kind: 'complete', value }) }, async fail() {},
      },
      provider: { async complete(value) { calls.push({ kind: 'provider', value }); return { content: '正义提醒你保持平衡。', truncated: false, providerRequestId: 'id', promptTokens: 30, completionTokens: 20 } } },
      policy, gate: createAiConcurrencyGate(1), providerName: 'openai-compatible', model: 'model',
    })
    await expect(service.complete({ request, sourceHash: 'source', now: new Date() })).resolves.toEqual({ content: '正义提醒你保持平衡。' })
    expect(calls.find((call) => call.kind === 'reserve')?.value).toMatchObject({ feature: 'tarot' })
    expect(calls.find((call) => call.kind === 'provider')?.value).toEqual([
      expect.objectContaining({ role: 'system', content: expect.stringContaining('塔罗占卜师') }),
      expect.objectContaining({ role: 'user', content: expect.stringContaining('XI - 正义 Justice') }),
    ])
    expect(calls.find((call) => call.kind === 'complete')?.value).not.toHaveProperty('content')
  })

  it('fails closed when Tarot AI is disabled', async () => {
    const service = createTarotService({ repository: { async reserve() { return { id: 'x' } }, async complete() {}, async fail() {} },
      provider: { async complete() { throw new Error('unused') } }, policy: { ...policy, enabled: false },
      gate: createAiConcurrencyGate(1), providerName: 'x', model: 'x' })
    await expect(service.complete({ request, sourceHash: 'source', now: new Date() })).rejects.toBeInstanceOf(TarotUnavailableError)
  })
})
