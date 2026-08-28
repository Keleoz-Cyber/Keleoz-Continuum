export type AiQuotaPolicy = {
  enabled: boolean
  maxRequestsPerSourceDay: number
  maxRequestsPerSession: number
  cooldownSeconds: number
  dailyBudgetMicroUsd: number
  inputMicroUsdPerMillionTokens: number
  outputMicroUsdPerMillionTokens: number
  maxOutputTokens: number
}

export function calculateAiReservationMicroUsd(inputCharacters: number, policy: AiQuotaPolicy) {
  const conservativeInputTokens = Math.max(0, Math.ceil(inputCharacters * 2))
  const inputCost = Math.ceil(
    (conservativeInputTokens * policy.inputMicroUsdPerMillionTokens) / 1_000_000,
  )
  const outputCost = Math.ceil(
    (policy.maxOutputTokens * policy.outputMicroUsdPerMillionTokens) / 1_000_000,
  )
  return inputCost + outputCost
}

export function evaluateAiQuota(policy: AiQuotaPolicy, usage: {
  sourceDayRequests: number
  sessionRequests: number
  secondsSinceLastRequest: number | null
  globalReservedMicroUsd: number
  reservationMicroUsd: number
}): { allowed: true } | { allowed: false; reason: string } {
  if (!policy.enabled) return { allowed: false, reason: 'disabled' }
  if (usage.sourceDayRequests >= policy.maxRequestsPerSourceDay) {
    return { allowed: false, reason: 'source_daily_limit' }
  }
  if (usage.sessionRequests >= policy.maxRequestsPerSession) {
    return { allowed: false, reason: 'session_limit' }
  }
  if (usage.secondsSinceLastRequest !== null && usage.secondsSinceLastRequest < policy.cooldownSeconds) {
    return { allowed: false, reason: 'cooldown' }
  }
  if (usage.globalReservedMicroUsd + usage.reservationMicroUsd > policy.dailyBudgetMicroUsd) {
    return { allowed: false, reason: 'daily_budget' }
  }
  return { allowed: true }
}

export function createAiConcurrencyGate(limit: number) {
  let active = 0

  return {
    tryAcquire(): (() => void) | null {
      if (active >= limit) return null
      active += 1
      let released = false
      return () => {
        if (released) return
        released = true
        active -= 1
      }
    },
  }
}
