import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createAuthRepository, OwnerAlreadyExistsError } from '@/modules/auth/repository'
import { createSessionMaterial } from '@/modules/auth/session'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createAuthRepository(drizzle(pool, { schema }))

beforeEach(async () => {
  await pool.query('delete from sessions')
  await pool.query('delete from owners')
})

afterAll(async () => {
  await pool.end()
})

describe('owner sessions', () => {
  it('resolves an active raw token and rejects it after expiry', async () => {
    const now = new Date('2026-08-26T12:00:00.000Z')
    const owner = await repository.createOwner({
      username: 'keleoz',
      passwordHash: 'argon2-test-hash',
    })
    const material = createSessionMaterial()

    await repository.createSession({
      ownerId: owner.id,
      tokenHash: material.tokenHash,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60_000),
    })

    await expect(repository.resolveOwnerByToken(material.token, now)).resolves.toEqual({
      id: owner.id,
      username: 'keleoz',
    })

    await pool.query('update sessions set expires_at = $1 where token_hash = $2', [
      new Date(now.getTime() - 1),
      material.tokenHash,
    ])
    await expect(repository.resolveOwnerByToken(material.token, now)).resolves.toBeNull()
  })

  it('refuses to create a second owner', async () => {
    await repository.createOwner({ username: 'keleoz', passwordHash: 'hash-one' })

    await expect(
      repository.createOwner({ username: 'another-owner', passwordHash: 'hash-two' }),
    ).rejects.toBeInstanceOf(OwnerAlreadyExistsError)
  })

  it('deletes a session using the raw cookie token', async () => {
    const owner = await repository.createOwner({ username: 'keleoz', passwordHash: 'hash-one' })
    const material = createSessionMaterial()
    await repository.createSession({
      ownerId: owner.id,
      tokenHash: material.tokenHash,
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
    })

    await repository.deleteSessionByToken(material.token)

    await expect(repository.resolveOwnerByToken(material.token)).resolves.toBeNull()
  })
})
