import { describe, expect, it } from 'vitest'

import { applyFailedAttempt } from '@/modules/auth/throttle'

describe('login throttle', () => {
  it('blocks the sixth failed attempt for fifteen minutes', () => {
    const now = new Date('2026-08-26T12:00:00.000Z')

    const state = applyFailedAttempt({ failures: 5, blockedUntil: null }, now)

    expect(state.failures).toBe(6)
    expect(state.blockedUntil?.getTime()).toBe(now.getTime() + 15 * 60_000)
  })
})
