import { describe, expect, it } from 'vitest'

import { createAiConcurrencyGate, type AiQuotaPolicy } from '@/modules/ai/quota'
import { StoryBusyError, StoryUnavailableError, createStoryService } from '@/modules/story/service'
import type { StoryGatewayRequest } from '@/modules/story/contracts'

const turnRequest: StoryGatewayRequest = {
  mode: 'turn',
  sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  genre: 'detective',
  horror: 'mid',
  customScript: null,
  messages: [{ role: 'user', content: '开始游戏' }],
}
const policy: AiQuotaPolicy = {
  enabled: true,
  maxRequestsPerSourceDay: 30,
  maxRequestsPerSession: 20,
  cooldownSeconds: 1,
  dailyBudgetMicroUsd: 1_000_000,
  inputMicroUsdPerMillionTokens: 200_000,
  outputMicroUsdPerMillionTokens: 800_000,
  maxOutputTokens: 1_200,
}

function createDependencies() {
  const calls: Array<{ kind: string; value: unknown }> = []
  return {
    calls,
    repository: {
      async reserve(value: unknown) { calls.push({ kind: 'reserve', value }); return { id: 'story-reservation' } },
      async complete(value: unknown) { calls.push({ kind: 'complete', value }) },
      async fail(value: unknown) { calls.push({ kind: 'fail', value }) },
    },
    turnProvider: {
      async complete(value: unknown) {
        calls.push({ kind: 'turn-provider', value })
        return { content: '{"story":"钟停了。","choices":["上楼","离开","敲钟"],"isEnding":false,"endingType":null,"mood":"shock"}', truncated: false, providerRequestId: 'turn-id', promptTokens: 80, completionTokens: 40 }
      },
    },
    documentProvider: {
      async complete(value: unknown) {
        calls.push({ kind: 'document-provider', value })
        return { content: '## 游戏概要\n钟楼。', truncated: true, providerRequestId: 'doc-id', promptTokens: 500, completionTokens: 8_192 }
      },
    },
  }
}

describe('Story service', () => {
  it('uses the server turn prompt and reserves Story quota without storing dialogue text', async () => {
    const dependencies = createDependencies()
    const service = createStoryService({
      ...dependencies,
      turnPolicy: policy,
      documentPolicy: { ...policy, maxOutputTokens: 8_192 },
      gate: createAiConcurrencyGate(2),
      providerName: 'openai-compatible',
      model: 'provider-model',
    })

    await expect(service.complete({ request: turnRequest, sourceHash: 'source-one', now: new Date('2026-08-29T01:00:00Z') }))
      .resolves.toMatchObject({ content: expect.stringContaining('钟停了'), truncated: false })
    expect(dependencies.calls.find((call) => call.kind === 'reserve')?.value).toMatchObject({ feature: 'story' })
    expect(dependencies.calls.find((call) => call.kind === 'turn-provider')?.value).toEqual([
      expect.objectContaining({ role: 'system', content: expect.stringContaining('12到16轮') }),
      { role: 'user', content: '开始游戏' },
    ])
    expect(dependencies.calls.find((call) => call.kind === 'complete')?.value).not.toHaveProperty('content')
  })

  it('uses the long-output provider and continuation contract for final documents', async () => {
    const dependencies = createDependencies()
    const service = createStoryService({
      ...dependencies,
      turnPolicy: policy,
      documentPolicy: { ...policy, maxOutputTokens: 8_192 },
      gate: createAiConcurrencyGate(2),
      providerName: 'openai-compatible',
      model: 'provider-model',
    })
    const request: StoryGatewayRequest = {
      ...turnRequest,
      mode: 'document',
      messages: [
        { role: 'user', content: '打开门' },
        { role: 'assistant', content: '{"story":"钟楼。","choices":["上楼","离开","敲钟"],"isEnding":true,"endingType":"normal","mood":"calm"}' },
      ],
      documentSoFar: '第一段',
      documentSegment: 1,
      documentGrant: 'a'.repeat(64),
    }

    await expect(service.complete({ request, sourceHash: 'source-one', now: new Date() }))
      .resolves.toEqual({ content: '## 游戏概要\n钟楼。', truncated: true })
    expect(dependencies.calls.some((call) => call.kind === 'turn-provider')).toBe(false)
    expect(dependencies.calls.find((call) => call.kind === 'document-provider')?.value).toEqual(expect.arrayContaining([
      { role: 'assistant', content: '第一段' },
      expect.objectContaining({ role: 'user', content: expect.stringContaining('直接从中断处') }),
    ]))
  })

  it('fails closed when disabled or the shared provider gate is occupied', async () => {
    const dependencies = createDependencies()
    const disabled = createStoryService({
      ...dependencies,
      turnPolicy: { ...policy, enabled: false },
      documentPolicy: { ...policy, enabled: false, maxOutputTokens: 8_192 },
      gate: createAiConcurrencyGate(1), providerName: 'openai-compatible', model: 'provider-model',
    })
    await expect(disabled.complete({ request: turnRequest, sourceHash: 'source', now: new Date() }))
      .rejects.toBeInstanceOf(StoryUnavailableError)

    const gate = createAiConcurrencyGate(1)
    gate.tryAcquire()
    const busy = createStoryService({
      ...dependencies, turnPolicy: policy, documentPolicy: { ...policy, maxOutputTokens: 8_192 },
      gate, providerName: 'openai-compatible', model: 'provider-model',
    })
    await expect(busy.complete({ request: turnRequest, sourceHash: 'source', now: new Date() }))
      .rejects.toBeInstanceOf(StoryBusyError)
  })
})
