import { and, eq, gt, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { owners, sessions } from '@/db/schema'
import type * as schema from '@/db/schema'
import { hashSessionToken } from '@/modules/auth/session'

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
  }
}
