import { and, desc, eq, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { letters } from '@/db/schema'
import type * as schema from '@/db/schema'
import type { z } from 'zod'
import { deriveLetterPostalCode, letterSubmissionSchema } from '@/modules/letters/contracts'

export class LetterRateLimitError extends Error {
  constructor() {
    super('Letter submission rate limit exceeded')
    this.name = 'LetterRateLimitError'
  }
}

export class LetterNotFoundError extends Error {
  constructor() {
    super('Letter was not found')
    this.name = 'LetterNotFoundError'
  }
}

type LetterSubmission = z.infer<typeof letterSubmissionSchema>

export function createLettersRepository(_database: NodePgDatabase<typeof schema>) {
  return {
    async submit(input: LetterSubmission & { sourceHash: string }) {
      const parsed = letterSubmissionSchema.parse(input)
      return _database.transaction(async (transaction) => {
        const [recent] = await transaction
          .select({ count: sql<number>`count(*)` })
          .from(letters)
          .where(
            and(
              eq(letters.sourceHash, input.sourceHash),
              sql`${letters.createdAt} > now() - interval '1 hour'`,
            ),
          )

        if (Number(recent?.count ?? 0) >= 3) {
          throw new LetterRateLimitError()
        }

        const id = randomUUID()
        const [created] = await transaction
          .insert(letters)
          .values({
            id,
            postalCode: deriveLetterPostalCode(id),
            senderName: parsed.senderName || null,
            content: parsed.content,
            visibility: parsed.visibility,
            sourceHash: input.sourceHash,
          })
          .returning()

        if (!created) {
          throw new Error('Letter insert did not return a row')
        }

        return created
      })
    },
    async listPublic() {
      return _database
        .select({
          id: letters.id,
          postalCode: letters.postalCode,
          senderName: letters.senderName,
          content: letters.content,
          visibility: letters.visibility,
          status: letters.status,
          ownerReply: letters.ownerReply,
          createdAt: letters.createdAt,
        })
        .from(letters)
        .where(and(eq(letters.status, 'approved'), eq(letters.visibility, 'public')))
        .orderBy(desc(letters.createdAt))
    },
    async listForOwner() {
      return _database.select().from(letters).orderBy(desc(letters.createdAt))
    },
    async review(input: { id: string; status: 'approved' | 'rejected'; ownerReply?: string }) {
      const [updated] = await _database
        .update(letters)
        .set({
          status: input.status,
          ownerReply: input.ownerReply?.trim() || null,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(letters.id, input.id))
        .returning()

      if (!updated) {
        throw new LetterNotFoundError()
      }

      return updated
    },
  }
}
