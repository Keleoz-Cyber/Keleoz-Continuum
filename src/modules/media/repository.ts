import { and, desc, eq, inArray } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { mediaObjects, mediaVariants } from '@/db/schema'
import type * as schema from '@/db/schema'

export type MediaVariantRecord = {
  name: string
  storageKey: string
  mimeType: string
  byteSize: number
  width: number
  height: number
}

export type ReadyMediaRecord = {
  id: string
  storageKey: string
  originalName: string
  mimeType: string
  byteSize: number
  sha256: string
  altText: string
  state: 'ready'
  width: number
  height: number
  createdAt: Date
  updatedAt: Date
  variants: MediaVariantRecord[]
}

export function createMediaRepository(database: NodePgDatabase<typeof schema>) {
  async function recordsWithVariants(rows: Array<Omit<ReadyMediaRecord, 'variants'>>) {
    if (!rows.length) return []
    const variants = await database.select({
      mediaId: mediaVariants.mediaId,
      name: mediaVariants.name,
      storageKey: mediaVariants.storageKey,
      mimeType: mediaVariants.mimeType,
      byteSize: mediaVariants.byteSize,
      width: mediaVariants.width,
      height: mediaVariants.height,
    }).from(mediaVariants).where(inArray(mediaVariants.mediaId, rows.map((row) => row.id)))
    const byMedia = new Map<string, MediaVariantRecord[]>()
    for (const variant of variants) {
      const list = byMedia.get(variant.mediaId) ?? []
      list.push(variant)
      byMedia.set(variant.mediaId, list)
    }
    return rows.map((row) => ({ ...row, variants: byMedia.get(row.id) ?? [] }))
  }

  async function listReady(whereHash?: string): Promise<ReadyMediaRecord[]> {
    const rows = await database.select({
      id: mediaObjects.id,
      storageKey: mediaObjects.storageKey,
      originalName: mediaObjects.originalName,
      mimeType: mediaObjects.mimeType,
      byteSize: mediaObjects.byteSize,
      sha256: mediaObjects.sha256,
      altText: mediaObjects.altText,
      state: mediaObjects.state,
      width: mediaObjects.width,
      height: mediaObjects.height,
      createdAt: mediaObjects.createdAt,
      updatedAt: mediaObjects.updatedAt,
    }).from(mediaObjects)
      .where(whereHash
        ? eq(mediaObjects.sha256, whereHash)
        : eq(mediaObjects.state, 'ready'))
      .orderBy(desc(mediaObjects.createdAt))
    const ready = rows.flatMap((row) => row.state === 'ready' && row.width && row.height
      ? [{ ...row, state: 'ready' as const, width: row.width, height: row.height }]
      : [])
    return recordsWithVariants(ready)
  }

  return {
    async findReadyByHash(sha256: string) { return (await listReady(sha256))[0] ?? null },
    async createPending(input: {
      id: string; storageKey: string; originalName: string; mimeType: string; byteSize: number
      sha256: string; altText: string; width: number; height: number; now: Date
    }) {
      const [record] = await database.insert(mediaObjects).values({
        id: input.id,
        storageKey: input.storageKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        sha256: input.sha256,
        altText: input.altText,
        width: input.width,
        height: input.height,
        createdAt: input.now,
        updatedAt: input.now,
      }).returning()
      if (!record) throw new Error('Pending media insert did not return a row')
      return record
    },
    async markReady(input: { id: string; variants: MediaVariantRecord[]; now: Date }) {
      await database.transaction(async (transaction) => {
        await transaction.insert(mediaVariants).values(input.variants.map((variant) => ({
          mediaId: input.id,
          ...variant,
          createdAt: input.now,
        })))
        await transaction.update(mediaObjects)
          .set({ state: 'ready', updatedAt: input.now })
          .where(eq(mediaObjects.id, input.id))
      })
    },
    async markFailed(id: string) {
      await database.update(mediaObjects).set({ state: 'failed', updatedAt: new Date() })
        .where(eq(mediaObjects.id, id))
    },
    listReady,
    async getReadyById(id: string) {
      const records = await listReady()
      return records.find((record) => record.id === id) ?? null
    },
    async getReadyVariantByStorageKey(storageKey: string) {
      const [variant] = await database.select({
        storageKey: mediaVariants.storageKey,
        mimeType: mediaVariants.mimeType,
        byteSize: mediaVariants.byteSize,
      }).from(mediaVariants)
        .innerJoin(mediaObjects, eq(mediaObjects.id, mediaVariants.mediaId))
        .where(and(eq(mediaVariants.storageKey, storageKey), eq(mediaObjects.state, 'ready')))
        .limit(1)
      return variant ?? null
    },
    async getReadyVariant(mediaId: string, name: string) {
      const [variant] = await database.select({
        storageKey: mediaVariants.storageKey,
        mimeType: mediaVariants.mimeType,
        byteSize: mediaVariants.byteSize,
        width: mediaVariants.width,
        height: mediaVariants.height,
      }).from(mediaVariants)
        .innerJoin(mediaObjects, eq(mediaObjects.id, mediaVariants.mediaId))
        .where(and(
          eq(mediaVariants.mediaId, mediaId),
          eq(mediaVariants.name, name),
          eq(mediaObjects.state, 'ready'),
        )).limit(1)
      return variant ?? null
    },
  }
}
