export type ThrottleState = {
  failures: number
  blockedUntil: Date | null
}

const BLOCK_AFTER_FAILURES = 6
const BLOCK_DURATION_MS = 15 * 60_000

export function applyFailedAttempt(state: ThrottleState, now: Date): ThrottleState {
  const failures = state.failures + 1

  return {
    failures,
    blockedUntil:
      failures >= BLOCK_AFTER_FAILURES
        ? new Date(now.getTime() + BLOCK_DURATION_MS)
        : state.blockedUntil,
  }
}
