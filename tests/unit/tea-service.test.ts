import { describe, expect, it } from 'vitest'

import { createAiConcurrencyGate, type AiQuotaPolicy } from '@/modules/ai/quota'
import { AiBusyError, AiUnavailableError, createTeaService } from '@/modules/tea/service'

const request = {
  sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  drink: 'green' as const,
  dessert: 'matcha' as const,
  isNight: false,
  messages: [{ role: 'user' as const, content: '陪我安静坐一会儿。' }],
}
const policy: AiQuotaPolicy = {
  enabled: true,
  maxRequestsPerSourceDay: 20,
  maxRequestsPerSession: 12,
  cooldownSeconds: 3,
  dailyBudgetMicroUsd: 100_000,
  inputMicroUsdPerMillionTokens: 200_000,
  outputMicroUsdPerMillionTokens: 800_000,
  maxOutputTokens: 320,
}

function createDependencies() {
  const calls: Array<{ kind: string; value: unknown }> = []
  return {
    calls,
    repository: {
      async reserve(value: unknown) {
        calls.push({ kind: 'reserve', value })
        return { id: 'reservation-id', status: 'reserved', reservedCostMicroUsd: 376 }
      },
      async complete(value: unknown) { calls.push({ kind: 'complete', value }) },
      async fail(value: unknown) { calls.push({ kind: 'fail', value }) },
    },
    provider: {
      async complete(value: unknown) {
        calls.push({ kind: 'provider', value })
        return { content: '那就先不说话。', providerRequestId: 'chatcmpl-test', promptTokens: 21, completionTokens: 8 }
      },
    },
  }
}

describe('Tea service', () => {
  it('does not return a cut-off reply as a successful Tea turn',async()=>{
    const deps=createDependencies()
    const service=createTeaService({...deps,provider:{async complete(){return {content:'只有半句',truncated:true,providerRequestId:'cut',promptTokens:10,completionTokens:320}}},policy,gate:createAiConcurrencyGate(1),providerName:'test',model:'test'})
    await expect(service.complete({request,sourceHash:'qa',now:new Date()})).rejects.toMatchObject({code:'output_truncated'})
    expect(deps.calls.find(call=>call.kind==='complete')?.value).toMatchObject({completionTokens:320})
    expect(deps.calls.at(-1)?.kind).toBe('fail')
  })
  it('rebuilds the site prompt, reserves quota, and records only provider metadata', async () => {
    const dependencies = createDependencies()
    const service = createTeaService({
      ...dependencies,
      policy,
      gate: createAiConcurrencyGate(2),
      providerName: 'openai-compatible',
      model: 'provider-model',
    })

    await expect(service.complete({ request, sourceHash: 'source-one', now: new Date('2026-08-29T01:00:00Z') }))
      .resolves.toEqual({ content: '那就先不说话。' })

    const providerCall = dependencies.calls.find((call) => call.kind === 'provider')
    expect(providerCall?.value).toEqual([
      expect.objectContaining({ role: 'system', content: expect.stringContaining('绿茶') }),
      { role: 'user', content: '陪我安静坐一会儿。' },
    ])
    expect(dependencies.calls.map((call) => call.kind)).toEqual(['reserve', 'provider', 'complete'])
    expect(dependencies.calls.find((call) => call.kind === 'complete')?.value).not.toHaveProperty('content')
  })

  it('marks failed reservations and releases the concurrency slot', async () => {
    const dependencies = createDependencies()
    dependencies.provider.complete = async () => { throw new Error('provider failed') }
    const gate = createAiConcurrencyGate(1)
    const service = createTeaService({
      ...dependencies, policy, gate, providerName: 'openai-compatible', model: 'provider-model',
    })

    await expect(service.complete({ request, sourceHash: 'source-one', now: new Date() })).rejects.toThrow('provider failed')
    expect(dependencies.calls.map((call) => call.kind)).toEqual(['reserve', 'fail'])
    expect(gate.tryAcquire()).toBeTypeOf('function')
  })

  it('fails closed when disabled or when every provider slot is occupied', async () => {
    const dependencies = createDependencies()
    const disabled = createTeaService({
      ...dependencies,
      policy: { ...policy, enabled: false },
      gate: createAiConcurrencyGate(1),
      providerName: 'openai-compatible',
      model: 'provider-model',
    })
    await expect(disabled.complete({ request, sourceHash: 'source-one', now: new Date() }))
      .rejects.toBeInstanceOf(AiUnavailableError)

    const gate = createAiConcurrencyGate(1)
    gate.tryAcquire()
    const busy = createTeaService({
      ...dependencies, policy, gate, providerName: 'openai-compatible', model: 'provider-model',
    })
    await expect(busy.complete({ request, sourceHash: 'source-one', now: new Date() }))
      .rejects.toBeInstanceOf(AiBusyError)
  })
})
