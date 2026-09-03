import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { AiQuotaError, createAiQuotaRepository } from '@/modules/ai/repository'
import type { AiQuotaPolicy } from '@/modules/ai/quota'
import { createOperationsRepository } from '@/modules/operations/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const database = drizzle(pool, { schema })
const operations = createOperationsRepository(database)
const quota = createAiQuotaRepository(database)
const now = new Date('2026-09-03T08:00:00.000Z')
const policy: AiQuotaPolicy = {
  enabled: true,
  maxRequestsPerSourceDay: 20,
  maxRequestsPerSession: 20,
  cooldownSeconds: 0,
  dailyBudgetMicroUsd: 100_000,
  inputMicroUsdPerMillionTokens: 200_000,
  outputMicroUsdPerMillionTokens: 800_000,
  maxOutputTokens: 320,
}

beforeEach(async () => {
  await pool.query('delete from ai_usage_events')
  await pool.query('delete from operation_settings')
})

afterAll(async () => {
  await pool.end()
})

describe('operations repository', () => {
  it('defaults Guest AI to enabled, persists an Owner pause, and leaves Owner Persona generation available', async () => {
    expect(await operations.getSettings()).toMatchObject({ guestAiEnabled: true, updatedAt: null })
    await operations.setGuestAiEnabled(false, now)
    expect(await operations.getSettings()).toMatchObject({ guestAiEnabled: false, updatedAt: now })

    await expect(quota.reserve({
      feature: 'tea', sourceHash: 'guest-source', sessionId: '11111111-1111-4111-8111-111111111111',
      provider: 'openai-compatible', model: 'provider-model', inputCharacters: 40, policy, now,
    })).rejects.toMatchObject({ reason: 'disabled' } satisfies Partial<AiQuotaError>)

    await expect(quota.reserve({
      feature: 'persona', sourceHash: 'owner-id', sessionId: '22222222-2222-4222-8222-222222222222',
      provider: 'openai-compatible', model: 'provider-model', inputCharacters: 40, policy, now,
    })).resolves.toMatchObject({ status: 'reserved' })
  })

  it('aggregates daily request state, distinct Guest sources and measured cost without exposing source hashes', async () => {
    await pool.query(`
      insert into ai_usage_events
        (feature, source_hash, session_id, status, provider, model, input_characters, output_characters,
         prompt_tokens, completion_tokens, reserved_cost_micro_usd, created_at, completed_at)
      values
        ('tea', 'private-source-a', '11111111-1111-4111-8111-111111111111', 'completed', 'provider', 'model', 10, 20, 1000, 250, 900, $1, $1),
        ('story', 'private-source-a', '22222222-2222-4222-8222-222222222222', 'failed', 'provider', 'model', 10, 0, null, null, 600, $1, $1),
        ('tarot', 'private-source-b', '33333333-3333-4333-8333-333333333333', 'reserved', 'provider', 'model', 10, 0, null, null, 500, $1, null),
        ('persona', 'owner-id', '44444444-4444-4444-8444-444444444444', 'completed', 'provider', 'model', 10, 20, 500, 125, 300, $1, $1)
    `, [now])

    const summary = await operations.getAiUsageSummary({
      now,
      dailyBudgetMicroUsd: 10_000,
      inputMicroUsdPerMillionTokens: 200_000,
      outputMicroUsdPerMillionTokens: 800_000,
    })

    expect(summary).toMatchObject({
      totalRequests: 4,
      completedRequests: 2,
      failedRequests: 1,
      pendingRequests: 1,
      guestUniqueSources: 2,
      reservedCostMicroUsd: 2_300,
      measuredCostMicroUsd: 600,
      remainingBudgetMicroUsd: 7_700,
    })
    expect(summary.features.find((feature) => feature.feature === 'tea')).toMatchObject({ requests: 1, reservedCostMicroUsd: 900 })
    expect(JSON.stringify(summary)).not.toContain('private-source')
  })
})
