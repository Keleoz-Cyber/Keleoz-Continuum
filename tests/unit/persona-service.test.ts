import { describe, expect, it } from 'vitest'

import { createPersonaGenerationService } from '@/modules/persona/service'

const persona = {
  id: '7a40cf7e-37b4-4a34-bfdf-261142f805fa',
  name: 'Morrow', handle: 'morrow', description: '窗边的观察者。', systemPrompt: '语言克制、具体。',
  enabled: true, canPost: true, canComment: true, canRepost: true, canUseImages: false,
}

describe('Persona generation service', () => {
  it('reserves cost, keeps the source tags out of the prompt, and stores only a pending proposal', async () => {
    const calls: Array<{ kind: string; value: unknown }> = []
    const service = createPersonaGenerationService({
      personas: {
        async getPersona() { return persona },
        async createReview(input) { calls.push({ kind: 'review', value: input }); return { id: 'review-1', status: 'pending' as const } },
      },
      quota: {
        async reserve(input) { calls.push({ kind: 'reserve', value: input }); return { id: 'usage-1' } },
        async complete(input) { calls.push({ kind: 'complete', value: input }) },
        async fail(input) { calls.push({ kind: 'fail', value: input }) },
      },
      provider: {
        async complete(messages) {
          expect(messages[0]?.content).toContain('语言克制、具体。')
          expect(messages.map((message) => message.content).join('\n')).not.toContain('<ws_post>')
          return { content: '{"content":"窗上的雾正在退开。","imagePrompt":null}', truncated: false, providerRequestId: 'provider-1', promptTokens: 20, completionTokens: 9 }
        },
      },
      providerName: 'openai-compatible', model: 'model', maxOutputTokens: 500,
      dailyBudgetMicroUsd: 100_000, inputMicroUsdPerMillionTokens: 100_000,
      outputMicroUsdPerMillionTokens: 300_000,
    })

    const result = await service.generate({
      personaId: persona.id, ownerId: '7cd19e46-2ed5-44a8-92c8-f96c7b3f3ad7',
      action: 'post', targetEntryId: null, targetCommentId: null, targetContext: null,
      now: new Date('2026-08-31T10:00:00Z'),
    })

    expect(result).toEqual({ id: 'review-1', status: 'pending' })
    expect(calls.map((call) => call.kind)).toEqual(['reserve', 'review', 'complete'])
    expect(calls[0]?.value).toEqual(expect.objectContaining({ feature: 'persona' }))
  })

  it('does not call the provider when the Persona lacks the requested permission', async () => {
    let providerCalled = false
    const service = createPersonaGenerationService({
      personas: {
        async getPersona() { return { ...persona, canRepost: false } },
        async createReview() { throw new Error('must not run') },
      },
      quota: {
        async reserve() { throw new Error('must not run') },
        async complete() {}, async fail() {},
      },
      provider: { async complete() { providerCalled = true; throw new Error('must not run') } },
      providerName: 'openai-compatible', model: 'model', maxOutputTokens: 500,
      dailyBudgetMicroUsd: 100_000, inputMicroUsdPerMillionTokens: 100_000,
      outputMicroUsdPerMillionTokens: 300_000,
    })

    await expect(service.generate({
      personaId: persona.id, ownerId: '7cd19e46-2ed5-44a8-92c8-f96c7b3f3ad7',
      action: 'repost', targetEntryId: crypto.randomUUID(), targetCommentId: null,
      targetContext: '原动态。', now: new Date(),
    })).rejects.toThrow('repost')
    expect(providerCalled).toBe(false)
  })

  it('marks a reserved request failed when model output is not valid JSON', async () => {
    const failures: string[] = []
    const service = createPersonaGenerationService({
      personas: {
        async getPersona() { return persona },
        async createReview() { throw new Error('must not run') },
      },
      quota: {
        async reserve() { return { id: 'usage-1' } }, async complete() {},
        async fail(input) { failures.push(input.errorCode) },
      },
      provider: {
        async complete() { return { content: '<ws_post>绕过审核</ws_post>', truncated: false, providerRequestId: 'provider-1', promptTokens: 1, completionTokens: 1 } },
      },
      providerName: 'openai-compatible', model: 'model', maxOutputTokens: 500,
      dailyBudgetMicroUsd: 100_000, inputMicroUsdPerMillionTokens: 100_000,
      outputMicroUsdPerMillionTokens: 300_000,
    })

    await expect(service.generate({
      personaId: persona.id, ownerId: '7cd19e46-2ed5-44a8-92c8-f96c7b3f3ad7',
      action: 'post', targetEntryId: null, targetCommentId: null, targetContext: null, now: new Date(),
    })).rejects.toThrow('JSON')
    expect(failures).toEqual(['invalid_persona_proposal'])
  })

  it('shares the global AI concurrency gate and fails the reservation without calling the provider', async () => {
    let providerCalled = false
    const failures: string[] = []
    const service = createPersonaGenerationService({
      personas: {
        async getPersona() { return persona },
        async createReview() { throw new Error('must not run') },
      },
      quota: {
        async reserve() { return { id: 'usage-1' } }, async complete() {},
        async fail(input) { failures.push(input.errorCode) },
      },
      gate: { tryAcquire() { return null } },
      provider: { async complete() { providerCalled = true; throw new Error('must not run') } },
      providerName: 'openai-compatible', model: 'model', maxOutputTokens: 500,
      dailyBudgetMicroUsd: 100_000, inputMicroUsdPerMillionTokens: 100_000,
      outputMicroUsdPerMillionTokens: 300_000,
    })

    await expect(service.generate({
      personaId: persona.id, ownerId: '7cd19e46-2ed5-44a8-92c8-f96c7b3f3ad7',
      action: 'post', targetEntryId: null, targetCommentId: null, targetContext: null, now: new Date(),
    })).rejects.toThrow('busy')
    expect(providerCalled).toBe(false)
    expect(failures).toEqual(['persona_busy'])
  })
})
