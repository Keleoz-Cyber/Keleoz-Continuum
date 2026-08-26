import { and, eq, gt, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { loginThrottles, owners, sessions } from '@/db/schema'
import type * as schema from '@/db/schema'
import { hashSessionToken } from '@/modules/auth/session'
import { applyFailedAttempt, type ThrottleState } from '@/modules/auth/throttle'

export class OwnerAlreadyExistsError extends Error {
  constructor() {
    super('An owner already exists')
    this.name = 'OwnerAlreadyExistsError'
  }
}

export type AuthRepository = {
  createOwner(input: { username: string; passwordHash: string }): Promise<{ id: string; username: string }>
  createSession(input: { ownerId: string; tokenHash: string; expiresAt: Date }): Promise<void>
  resolveOwnerByToken(token: string, now?: Date): Promise<{ id: string; username: string } | null>
  findOwnerByUsername(
    username: string,
  ): Promise<{ id: string; username: string; passwordHash: string } | null>
  getThrottle(fingerprintHash: string): Promise<ThrottleState>
  recordFailedAttempt(fingerprintHash: string, now: Date): Promise<ThrottleState>
  resetThrottle(fingerprintHash: string): Promise<void>
  deleteSessionByToken(token: string): Promise<void>
}

export function createAuthRepository(database: NodePgDatabase<typeof schema>): AuthRepository {
  return {
    async createOwner(input) {
      return database.transaction(async (transaction) => {
        await transaction.execute(sql`select pg_advisory_xact_lock(8675309)`)

        const [existingOwner] = await transaction.select({ id: owners.id }).from(owners).limit(1)
        if (existingOwner) {
          throw new OwnerAlreadyExistsError()
        }

        const [owner] = await transaction
          .insert(owners)
          .values({ username: input.username, passwordHash: input.passwordHash })
          .returning({ id: owners.id, username: owners.username })

        if (!owner) {
          throw new Error('Owner insert did not return a row')
        }

        return owner
      })
    },
    async createSession(input) {
      await database.insert(sessions).values(input)
    },
    async resolveOwnerByToken(token, now = new Date()) {
      const [owner] = await database
        .select({ id: owners.id, username: owners.username })
        .from(sessions)
        .innerJoin(owners, eq(sessions.ownerId, owners.id))
        .where(and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, now)))
        .limit(1)

      return owner ?? null
    },
    async findOwnerByUsername(username) {
      const [owner] = await database
        .select({
          id: owners.id,
          username: owners.username,
          passwordHash: owners.passwordHash,
        })
        .from(owners)
        .where(eq(owners.username, username))
        .limit(1)

      return owner ?? null
    },
    async getThrottle(fingerprintHash) {
      const [state] = await database
        .select({
          failures: loginThrottles.failures,
          blockedUntil: loginThrottles.blockedUntil,
        })
        .from(loginThrottles)
        .where(eq(loginThrottles.fingerprintHash, fingerprintHash))
        .limit(1)

      return state ?? { failures: 0, blockedUntil: null }
    },
    async recordFailedAttempt(fingerprintHash, now) {
      return database.transaction(async (transaction) => {
        await transaction.execute(
          sql`select pg_advisory_xact_lock(hashtext(${fingerprintHash}))`,
        )
        const [existing] = await transaction
          .select({
            failures: loginThrottles.failures,
            blockedUntil: loginThrottles.blockedUntil,
          })
          .from(loginThrottles)
          .where(eq(loginThrottles.fingerprintHash, fingerprintHash))
          .limit(1)
        const next = applyFailedAttempt(existing ?? { failures: 0, blockedUntil: null }, now)

        await transaction
          .insert(loginThrottles)
          .values({ fingerprintHash, ...next, updatedAt: now })
          .onConflictDoUpdate({
            target: loginThrottles.fingerprintHash,
            set: { ...next, updatedAt: now },
          })

        return next
      })
    },
    async resetThrottle(fingerprintHash) {
      await database.delete(loginThrottles).where(eq(loginThrottles.fingerprintHash, fingerprintHash))
    },
    async deleteSessionByToken(token) {
      await database.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)))
    },
  }
}
