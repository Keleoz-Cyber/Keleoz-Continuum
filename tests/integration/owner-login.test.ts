import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { hashPassword } from '@/modules/auth/crypto'
import { createAuthRepository } from '@/modules/auth/repository'
import { authenticateOwner } from '@/modules/auth/service'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createAuthRepository(drizzle(pool, { schema }))
const now = new Date('2026-08-27T03:00:00.000Z')

beforeEach(async () => {
  await pool.query('delete from sessions')
  await pool.query('delete from login_throttles')
  await pool.query('delete from owners')
  await repository.createOwner({
    username: 'keleoz',
    passwordHash: await hashPassword('a-strong-owner-password'),
  })
})

afterAll(async () => {
  await pool.end()
})

describe('owner login service', () => {
  it('creates a 30-day opaque session after valid credentials', async () => {
    const result = await authenticateOwner(repository, {
      username: '  Keleoz ',
      password: 'a-strong-owner-password',
      clientAddress: '127.0.0.1',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      now,
    })

    expect(result).toMatchObject({ ok: true, owner: { username: 'keleoz' } })
    if (!result.ok) throw new Error('Expected a successful login')
    expect(result.expiresAt.getTime()).toBe(now.getTime() + 30 * 24 * 60 * 60_000)

    const stored = await pool.query<{ token_hash: string }>('select token_hash from sessions')
    expect(stored.rows).toHaveLength(1)
    expect(stored.rows[0]?.token_hash).not.toBe(result.token)
    expect(stored.rows[0]?.token_hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('blocks attempts after six failed passwords', async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await authenticateOwner(repository, {
        username: 'keleoz',
        password: 'wrong-password',
        clientAddress: '127.0.0.1',
        fingerprintSecret: '0123456789abcdef0123456789abcdef',
        now,
      })
    }

    const blocked = await authenticateOwner(repository, {
      username: 'keleoz',
      password: 'a-strong-owner-password',
      clientAddress: '127.0.0.1',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      now,
    })

    expect(blocked).toMatchObject({
      ok: false,
      reason: 'blocked',
      retryAt: new Date(now.getTime() + 15 * 60_000),
    })
    const sessions = await pool.query('select 1 from sessions')
    expect(sessions.rows).toHaveLength(0)
  })
})
