import { createHmac } from 'node:crypto'

import { verifyPassword } from '@/modules/auth/crypto'
import type { AuthRepository } from '@/modules/auth/repository'
import { createSessionMaterial } from '@/modules/auth/session'

export type AuthenticateOwnerInput = {
  username: string
  password: string
  clientAddress: string
  fingerprintSecret: string
  now?: Date
}

export type AuthenticateOwnerResult =
  | {
      ok: true
      owner: { id: string; username: string }
      token: string
      expiresAt: Date
    }
  | {
      ok: false
      reason: 'invalid' | 'blocked'
      retryAt?: Date
    }

export async function authenticateOwner(
  repository: AuthRepository,
  input: AuthenticateOwnerInput,
): Promise<AuthenticateOwnerResult> {
  const now = input.now ?? new Date()
  const username = input.username.trim().toLowerCase()
  const fingerprintHash = createHmac('sha256', input.fingerprintSecret)
    .update(`${username}\0${input.clientAddress}`)
    .digest('hex')
  const throttle = await repository.getThrottle(fingerprintHash)

  if (throttle.blockedUntil && throttle.blockedUntil > now) {
    return { ok: false, reason: 'blocked', retryAt: throttle.blockedUntil }
  }

  const owner = await repository.findOwnerByUsername(username)
  const passwordMatches = owner
    ? await verifyPassword(owner.passwordHash, input.password)
    : false

  if (!owner || !passwordMatches) {
    await repository.recordFailedAttempt(fingerprintHash, now)
    return { ok: false, reason: 'invalid' }
  }

  await repository.resetThrottle(fingerprintHash)
  const material = createSessionMaterial()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60_000)
  await repository.createSession({
    ownerId: owner.id,
    tokenHash: material.tokenHash,
    expiresAt,
  })

  return {
    ok: true,
    owner: { id: owner.id, username: owner.username },
    token: material.token,
    expiresAt,
  }
}
