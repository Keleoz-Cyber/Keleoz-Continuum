import { describe, expect, it } from 'vitest'

import {
  calculateAiReservationMicroUsd,
  createAiConcurrencyGate,
  evaluateAiQuota,
  getSharedAiConcurrencyGate,
  type AiQuotaPolicy,
} from '@/modules/ai/quota'

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

type UsagePatch = Partial<{
  sourceDayRequests: number
  sessionRequests: number
  secondsSinceLastRequest: number | null
  globalReservedMicroUsd: number
}>

const rejectedCases: Array<[string, Partial<AiQuotaPolicy>, string, UsagePatch?]> = [
  ['disabled', { enabled: false }, 'disabled'],
  ['source-day', {}, 'source_daily_limit', { sourceDayRequests: 20 }],
  ['session', {}, 'session_limit', { sessionRequests: 12 }],
  ['cooldown', {}, 'cooldown', { secondsSinceLastRequest: 2 }],
  ['budget', {}, 'daily_budget', { globalReservedMicroUsd: 99_900 }],
]

describe('AI quota policy', () => {
  it('shares one concurrency gate across feature runtimes in production too', () => {
    const holder: { continuumAiGate?: ReturnType<typeof createAiConcurrencyGate> } = {}
    const teaGate = getSharedAiConcurrencyGate(holder, 1)
    const release = teaGate.tryAcquire()
    const storyGate = getSharedAiConcurrencyGate(holder, 1)

    expect(storyGate).toBe(teaGate)
    expect(storyGate.tryAcquire()).toBeNull()
    release?.()
    expect(storyGate.tryAcquire()).toBeTypeOf('function')
  })

  it('reserves against the maximum bounded output before calling a provider', () => {
    expect(calculateAiReservationMicroUsd(300, policy)).toBe(376)
  })

  it.each(rejectedCases)('rejects %s requests', (_name, policyPatch, reason, usagePatch = {}) => {
    expect(evaluateAiQuota(
      { ...policy, ...policyPatch },
      {
        sourceDayRequests: 0,
        sessionRequests: 0,
        secondsSinceLastRequest: null,
        globalReservedMicroUsd: 0,
        reservationMicroUsd: 376,
        ...usagePatch,
      },
    )).toEqual({ allowed: false, reason })
  })

  it('allows a request inside every boundary', () => {
    expect(evaluateAiQuota(policy, {
      sourceDayRequests: 4,
      sessionRequests: 3,
      secondsSinceLastRequest: 9,
      globalReservedMicroUsd: 4_000,
      reservationMicroUsd: 376,
    })).toEqual({ allowed: true })
  })

  it('bounds concurrent provider calls and releases slots idempotently', () => {
    const gate = createAiConcurrencyGate(2)
    const releaseOne = gate.tryAcquire()
    const releaseTwo = gate.tryAcquire()

    expect(releaseOne).toBeTypeOf('function')
    expect(releaseTwo).toBeTypeOf('function')
    expect(gate.tryAcquire()).toBeNull()

    releaseOne?.()
    releaseOne?.()
    expect(gate.tryAcquire()).toBeTypeOf('function')
  })
})
