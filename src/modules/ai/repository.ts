import { and, eq, gte, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { aiUsageEvents } from '@/db/schema'
import type * as schema from '@/db/schema'
import {
  calculateAiReservationMicroUsd,
  evaluateAiQuota,
  type AiQuotaPolicy,
} from '@/modules/ai/quota'

export type AiQuotaReason =
  | 'disabled'
  | 'source_daily_limit'
  | 'session_limit'
  | 'cooldown'
  | 'daily_budget'

export class AiQuotaError extends Error {
  constructor(public readonly reason: AiQuotaReason) {
    super(reason)
    this.name = 'AiQuotaError'
  }
}

type ReserveInput = {
  feature: 'tea'
  sourceHash: string
  sessionId: string
  provider: string
  model: string
  inputCharacters: number
  policy: AiQuotaPolicy
  now: Date
}

function utcDayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function createAiQuotaRepository(database: NodePgDatabase<typeof schema>) {
  return {
    async reserve(input: ReserveInput) {
      return database.transaction(async (transaction) => {
        await transaction.execute(sql`select pg_advisory_xact_lock(hashtext('continuum-ai-quota'))`)
        const dayStart = utcDayStart(input.now)

        const [sourceUsage] = await transaction
          .select({
            count: sql<number>`count(*)`,
            lastCreatedAt: sql<Date | null>`max(${aiUsageEvents.createdAt})`,
          })
          .from(aiUsageEvents)
          .where(and(
            eq(aiUsageEvents.feature, input.feature),
            eq(aiUsageEvents.sourceHash, input.sourceHash),
            gte(aiUsageEvents.createdAt, dayStart),
          ))
        const [sessionUsage] = await transaction
          .select({ count: sql<number>`count(*)` })
          .from(aiUsageEvents)
          .where(and(
            eq(aiUsageEvents.feature, input.feature),
            eq(aiUsageEvents.sessionId, input.sessionId),
          ))
        const [globalUsage] = await transaction
          .select({
            reserved: sql<number>`coalesce(sum(${aiUsageEvents.reservedCostMicroUsd}), 0)`,
          })
          .from(aiUsageEvents)
          .where(gte(aiUsageEvents.createdAt, dayStart))

        const reservationMicroUsd = calculateAiReservationMicroUsd(input.inputCharacters, input.policy)
        const lastCreatedAt = sourceUsage?.lastCreatedAt
        const decision = evaluateAiQuota(input.policy, {
          sourceDayRequests: Number(sourceUsage?.count ?? 0),
          sessionRequests: Number(sessionUsage?.count ?? 0),
          secondsSinceLastRequest: lastCreatedAt
            ? (input.now.getTime() - new Date(lastCreatedAt).getTime()) / 1_000
            : null,
          globalReservedMicroUsd: Number(globalUsage?.reserved ?? 0),
          reservationMicroUsd,
        })
        if (!decision.allowed) throw new AiQuotaError(decision.reason as AiQuotaReason)

        const [reservation] = await transaction
          .insert(aiUsageEvents)
          .values({
            feature: input.feature,
            sourceHash: input.sourceHash,
            sessionId: input.sessionId,
            provider: input.provider,
            model: input.model,
            inputCharacters: input.inputCharacters,
            reservedCostMicroUsd: reservationMicroUsd,
            createdAt: input.now,
          })
          .returning({
            id: aiUsageEvents.id,
            status: aiUsageEvents.status,
            reservedCostMicroUsd: aiUsageEvents.reservedCostMicroUsd,
          })
        if (!reservation) throw new Error('AI reservation insert did not return a row')
        return reservation
      })
    },

    async complete(input: {
      id: string
      outputCharacters: number
      promptTokens: number
      completionTokens: number
      providerRequestId: string
      completedAt: Date
    }) {
      await database
        .update(aiUsageEvents)
        .set({
          status: 'completed',
          outputCharacters: input.outputCharacters,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          providerRequestId: input.providerRequestId,
          completedAt: input.completedAt,
        })
        .where(eq(aiUsageEvents.id, input.id))
    },

    async fail(input: { id: string; errorCode: string; completedAt: Date }) {
      await database
        .update(aiUsageEvents)
        .set({ status: 'failed', errorCode: input.errorCode, completedAt: input.completedAt })
        .where(eq(aiUsageEvents.id, input.id))
    },
  }
}
