import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '@/modules/auth/crypto'
import { createSessionMaterial } from '@/modules/auth/session'

describe('owner auth crypto', () => {
  it('verifies the right password and rejects the wrong password', async () => {
    const hash = await hashPassword('a-long-owner-password')

    await expect(verifyPassword(hash, 'a-long-owner-password')).resolves.toBe(true)
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false)
  })

  it('stores only a hash of the bearer token', () => {
    const session = createSessionMaterial()

    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(session.tokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(session.tokenHash).not.toContain(session.token)
  })
})
