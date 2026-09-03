import { asc, eq, gte } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import {
  aiUsageEvents,
  contentEntries,
  contentMedia,
  contentPublications,
  contentVersions,
  letters,
  mediaObjects,
  mediaVariants,
  momentAuthorships,
  momentComments,
  momentPersonas,
  operationSettings,
  personaReviews,
} from '@/db/schema'
import type * as schema from '@/db/schema'
import { calculateMeasuredAiCostMicroUsd } from '@/modules/operations/contracts'

const PRIMARY_SETTINGS_ID = 'primary'
const FEATURES = ['tea', 'story', 'tarot', 'persona'] as const

function utcDayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function createOperationsRepository(database: NodePgDatabase<typeof schema>) {
  async function getSettings() {
    const [settings] = await database
      .select({ guestAiEnabled: operationSettings.guestAiEnabled, updatedAt: operationSettings.updatedAt })
      .from(operationSettings)
      .where(eq(operationSettings.id, PRIMARY_SETTINGS_ID))
      .limit(1)
    return settings ?? { guestAiEnabled: true, updatedAt: null }
  }

  return {
    getSettings,

    async setGuestAiEnabled(guestAiEnabled: boolean, now = new Date()) {
      const [settings] = await database
        .insert(operationSettings)
        .values({ id: PRIMARY_SETTINGS_ID, guestAiEnabled, updatedAt: now })
        .onConflictDoUpdate({
          target: operationSettings.id,
          set: { guestAiEnabled, updatedAt: now },
        })
        .returning({ guestAiEnabled: operationSettings.guestAiEnabled, updatedAt: operationSettings.updatedAt })
      if (!settings) throw new Error('Operation settings update did not return a row')
      return settings
    },

    async getAiUsageSummary(input: {
      now: Date
      dailyBudgetMicroUsd: number
      inputMicroUsdPerMillionTokens: number
      outputMicroUsdPerMillionTokens: number
    }) {
      const rows = await database
        .select({
          feature: aiUsageEvents.feature,
          status: aiUsageEvents.status,
          sourceHash: aiUsageEvents.sourceHash,
          promptTokens: aiUsageEvents.promptTokens,
          completionTokens: aiUsageEvents.completionTokens,
          reservedCostMicroUsd: aiUsageEvents.reservedCostMicroUsd,
        })
        .from(aiUsageEvents)
        .where(gte(aiUsageEvents.createdAt, utcDayStart(input.now)))

      const featureMap = new Map(FEATURES.map((feature) => [feature, { feature, requests: 0, reservedCostMicroUsd: 0, measuredCostMicroUsd: 0 }]))
      const guestSources = new Set<string>()
      let completedRequests = 0
      let failedRequests = 0
      let pendingRequests = 0
      let reservedCostMicroUsd = 0
      let measuredCostMicroUsd = 0
      for (const row of rows) {
        if (row.feature !== 'persona') guestSources.add(row.sourceHash)
        if (row.status === 'completed') completedRequests += 1
        else if (row.status === 'failed') failedRequests += 1
        else pendingRequests += 1
        const measured = row.status === 'completed'
          ? calculateMeasuredAiCostMicroUsd({
              promptTokens: row.promptTokens,
              completionTokens: row.completionTokens,
              inputMicroUsdPerMillionTokens: input.inputMicroUsdPerMillionTokens,
              outputMicroUsdPerMillionTokens: input.outputMicroUsdPerMillionTokens,
            })
          : 0
        reservedCostMicroUsd += row.reservedCostMicroUsd
        measuredCostMicroUsd += measured
        const feature = featureMap.get(row.feature as typeof FEATURES[number])
        if (feature) {
          feature.requests += 1
          feature.reservedCostMicroUsd += row.reservedCostMicroUsd
          feature.measuredCostMicroUsd += measured
        }
      }

      return {
        dayStartedAt: utcDayStart(input.now),
        totalRequests: rows.length,
        completedRequests,
        failedRequests,
        pendingRequests,
        guestUniqueSources: guestSources.size,
        reservedCostMicroUsd,
        measuredCostMicroUsd,
        remainingBudgetMicroUsd: Math.max(0, input.dailyBudgetMicroUsd - reservedCostMicroUsd),
        features: FEATURES.map((feature) => featureMap.get(feature)!),
      }
    },

    async createPortableExport(input: { ownerUsername: string | null; generatedAt?: Date }) {
      const [
        entries,
        versions,
        publications,
        letterRows,
        objects,
        variants,
        attachments,
        personas,
        comments,
        authorships,
        reviews,
        settings,
      ] = await Promise.all([
        database.select().from(contentEntries).orderBy(asc(contentEntries.createdAt), asc(contentEntries.id)),
        database.select().from(contentVersions).orderBy(asc(contentVersions.createdAt), asc(contentVersions.id)),
        database.select().from(contentPublications).orderBy(asc(contentPublications.publishedAt), asc(contentPublications.entryId)),
        database.select({
          id: letters.id,
          postalCode: letters.postalCode,
          senderName: letters.senderName,
          content: letters.content,
          visibility: letters.visibility,
          status: letters.status,
          ownerReply: letters.ownerReply,
          createdAt: letters.createdAt,
          reviewedAt: letters.reviewedAt,
          updatedAt: letters.updatedAt,
        }).from(letters).orderBy(asc(letters.createdAt), asc(letters.id)),
        database.select().from(mediaObjects).orderBy(asc(mediaObjects.createdAt), asc(mediaObjects.id)),
        database.select().from(mediaVariants).orderBy(asc(mediaVariants.createdAt), asc(mediaVariants.id)),
        database.select().from(contentMedia).orderBy(asc(contentMedia.entryId), asc(contentMedia.position)),
        database.select().from(momentPersonas).orderBy(asc(momentPersonas.createdAt), asc(momentPersonas.id)),
        database.select().from(momentComments).orderBy(asc(momentComments.createdAt), asc(momentComments.id)),
        database.select().from(momentAuthorships).orderBy(asc(momentAuthorships.createdAt), asc(momentAuthorships.entryId)),
        database.select().from(personaReviews).orderBy(asc(personaReviews.createdAt), asc(personaReviews.id)),
        getSettings(),
      ])

      return {
        format: 'keleoz-continuum-export' as const,
        schemaVersion: 1 as const,
        generatedAt: (input.generatedAt ?? new Date()).toISOString(),
        owner: { username: input.ownerUsername },
        settings: { guestAiEnabled: settings.guestAiEnabled },
        content: { entries, versions, publications, media: attachments },
        letters: letterRows,
        media: { objects, variants },
        moments: { personas, comments, authorships, reviews },
      }
    },
  }
}
