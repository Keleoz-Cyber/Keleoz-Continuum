import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { AiQuotaError, createAiQuotaRepository } from '@/modules/ai/repository'
import type { AiQuotaPolicy } from '@/modules/ai/quota'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createAiQuotaRepository(drizzle(pool, { schema }))
const now = new Date('2026-08-29T01:00:00.000Z')
const policy: AiQuotaPolicy = {
  enabled: true,
  maxRequestsPerSourceDay: 2,
  maxRequestsPerSession: 2,
  cooldownSeconds: 3,
  dailyBudgetMicroUsd: 100_000,
  inputMicroUsdPerMillionTokens: 200_000,
  outputMicroUsdPerMillionTokens: 800_000,
  maxOutputTokens: 320,
}

beforeEach(async () => {
  await pool.query('delete from ai_usage_events')
})

afterAll(async () => {
  await pool.end()
})

describe('AI quota repository', () => {
  it('atomically reserves a bounded Tea request without storing dialogue text', async () => {
    const reservation = await repository.reserve({
      feature: 'tea',
      sourceHash: 'source-one',
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      provider: 'openai-compatible',
      model: 'provider-model',
      inputCharacters: 300,
      policy,
      now,
    })

    expect(reservation).toMatchObject({ status: 'reserved', reservedCostMicroUsd: 376 })
    const result = await pool.query('select * from ai_usage_events where id = $1', [reservation.id])
    expect(result.rows[0]).not.toHaveProperty('content')
    expect(result.rows[0]).not.toHaveProperty('messages')
  })

  it('uses an independent Story feature ledger without storing story dialogue', async () => {
    const reservation = await repository.reserve({
      feature: 'story',
      sourceHash: 'story-source',
      sessionId: '68166d83-284b-4cff-a5e9-e93506408db3',
      provider: 'openai-compatible',
      model: 'provider-model',
      inputCharacters: 900,
      policy: { ...policy, maxOutputTokens: 1_200 },
      now,
    })

    const result = await pool.query('select feature, input_characters from ai_usage_events where id = $1', [reservation.id])
    expect(result.rows[0]).toEqual({ feature: 'story', input_characters: 900 })
    expect(result.rows[0]).not.toHaveProperty('content')
  })

  it('enforces cooldown and source/session daily limits under one reservation lock', async () => {
    const input = {
      feature: 'tea' as const,
      sourceHash: 'source-one',
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      provider: 'openai-compatible',
      model: 'provider-model',
      inputCharacters: 300,
      policy,
    }
    await repository.reserve({ ...input, now })

    await expect(repository.reserve({ ...input, now: new Date(now.getTime() + 2_000) }))
      .rejects.toMatchObject({ reason: 'cooldown' } satisfies Partial<AiQuotaError>)
    await repository.reserve({ ...input, now: new Date(now.getTime() + 4_000) })
    await expect(repository.reserve({ ...input, now: new Date(now.getTime() + 8_000) }))
      .rejects.toMatchObject({ reason: 'source_daily_limit' } satisfies Partial<AiQuotaError>)
  })

  it('reserves the global daily budget before a provider call', async () => {
    const tightBudget = { ...policy, dailyBudgetMicroUsd: 500 }
    await repository.reserve({
      feature: 'tea', sourceHash: 'source-one', sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      provider: 'openai-compatible', model: 'provider-model', inputCharacters: 300, policy: tightBudget, now,
    })

    await expect(repository.reserve({
      feature: 'tea', sourceHash: 'source-two', sessionId: '68166d83-284b-4cff-a5e9-e93506408db3',
      provider: 'openai-compatible', model: 'provider-model', inputCharacters: 300, policy: tightBudget, now,
    })).rejects.toMatchObject({ reason: 'daily_budget' } satisfies Partial<AiQuotaError>)
  })

  it('records provider completion metadata without response text', async () => {
    const reservation = await repository.reserve({
      feature: 'tea', sourceHash: 'source-one', sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      provider: 'openai-compatible', model: 'provider-model', inputCharacters: 300, policy, now,
    })
    await repository.complete({
      id: reservation.id,
      outputCharacters: 42,
      promptTokens: 21,
      completionTokens: 8,
      providerRequestId: 'chatcmpl-test',
      completedAt: new Date(now.getTime() + 900),
    })

    const result = await pool.query('select status, output_characters, prompt_tokens, completion_tokens, provider_request_id from ai_usage_events where id = $1', [reservation.id])
    expect(result.rows[0]).toEqual({
      status: 'completed',
      output_characters: 42,
      prompt_tokens: 21,
      completion_tokens: 8,
      provider_request_id: 'chatcmpl-test',
    })
  })
})
