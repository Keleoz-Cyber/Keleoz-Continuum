import { randomUUID } from 'node:crypto'

import {
  buildMediaStorageKey,
  buildOriginalStorageKey,
  contentDispositionForMedia,
  createImageVariants,
  inspectGenericUpload,
  inspectImageUpload,
} from '@/modules/media/contracts'
import type { MediaVariantRecord, ReadyMediaRecord } from '@/modules/media/repository'
import type { MediaStorage } from '@/modules/media/storage'

type MediaRepository = {
  findReadyByHash(sha256: string): Promise<ReadyMediaRecord | null>
  createPending(input: {
    id: string; storageKey: string; originalName: string; mimeType: string; byteSize: number
    sha256: string; altText: string; width: number | null; height: number | null; now: Date
  }): Promise<unknown>
  markReady(input: { id: string; variants: MediaVariantRecord[]; now: Date }): Promise<void>
  markFailed(id: string): Promise<void>
  listReady(): Promise<ReadyMediaRecord[]>
  getReadyById(id: string): Promise<ReadyMediaRecord | null>
  prepareDelete(id: string): Promise<ReadyMediaRecord>
  deleteRecord(id: string): Promise<void>
}

export type PublicMediaRecord = Omit<ReadyMediaRecord, 'variants'> & {
  kind: 'image' | 'audio' | 'video' | 'attachment'
  variants: Array<MediaVariantRecord & { publicUrl: string }>
}

export function createMediaService(deps: { repository: MediaRepository; storage: MediaStorage }) {
  const toPublic = (record: ReadyMediaRecord): PublicMediaRecord => ({
    ...record,
    kind: record.mimeType.startsWith('image/') ? 'image'
      : record.mimeType.startsWith('audio/') ? 'audio'
        : record.mimeType.startsWith('video/') ? 'video' : 'attachment',
    variants: record.variants.map((variant) => ({ ...variant, publicUrl: deps.storage.publicUrl(variant.storageKey) })),
  })
  return {
    async uploadImage(input: {
      bytes: Buffer; originalName: string; declaredMimeType: string; altText: string; now?: Date
    }) {
      const inspected = await inspectImageUpload(input)
      const duplicate = await deps.repository.findReadyByHash(inspected.sha256)
      if (duplicate) return toPublic(duplicate)
      const id = randomUUID()
      const now = input.now ?? new Date()
      const variants = await createImageVariants(input.bytes)
      const storedVariants = variants.map((variant) => ({
        name: variant.name,
        storageKey: buildMediaStorageKey({ mediaId: id, variant: variant.name, now }),
        mimeType: variant.mimeType,
        byteSize: variant.byteSize,
        width: variant.width,
        height: variant.height,
        bytes: variant.bytes,
      }))
      const canonical = storedVariants.find((variant) => variant.name === 'large-webp')!
      await deps.repository.createPending({
        id,
        storageKey: canonical.storageKey,
        originalName: inspected.originalName,
        mimeType: canonical.mimeType,
        byteSize: inspected.byteSize,
        sha256: inspected.sha256,
        altText: input.altText.trim().slice(0, 2_000),
        width: inspected.width,
        height: inspected.height,
        now,
      })
      const written: string[] = []
      try {
        for (const variant of storedVariants) {
          await deps.storage.put({ key: variant.storageKey, bytes: variant.bytes, mimeType: variant.mimeType })
          written.push(variant.storageKey)
        }
        await deps.repository.markReady({
          id,
          now,
          variants: storedVariants.map((variant) => ({
            name: variant.name,
            storageKey: variant.storageKey,
            mimeType: variant.mimeType,
            byteSize: variant.byteSize,
            width: variant.width,
            height: variant.height,
          })),
        })
      } catch (error) {
        await Promise.allSettled(written.map((key) => deps.storage.delete(key)))
        await deps.repository.markFailed(id)
        throw error
      }
      const ready = await deps.repository.getReadyById(id)
      if (!ready) throw new Error('Ready media record was not found after upload')
      return toPublic(ready)
    },
    async uploadFile(input: {
      bytes: Buffer; originalName: string; declaredMimeType: string; altText: string; now?: Date
    }) {
      if (input.declaredMimeType.startsWith('image/')) return this.uploadImage(input)
      const inspected = await inspectGenericUpload(input)
      const duplicate = await deps.repository.findReadyByHash(inspected.sha256)
      if (duplicate) return toPublic(duplicate)
      const id = randomUUID()
      const now = input.now ?? new Date()
      const storageKey = buildOriginalStorageKey({ mediaId: id, extension: inspected.extension, now })
      await deps.repository.createPending({
        id, storageKey, originalName: inspected.originalName, mimeType: inspected.mimeType,
        byteSize: inspected.byteSize, sha256: inspected.sha256,
        altText: input.altText.trim().slice(0, 2_000), width: null, height: null, now,
      })
      try {
        await deps.storage.put({
          key: storageKey,
          bytes: input.bytes,
          mimeType: inspected.mimeType,
          contentDisposition: contentDispositionForMedia(inspected.mimeType, inspected.originalName),
        })
        await deps.repository.markReady({
          id, now, variants: [{
            name: 'original', storageKey, mimeType: inspected.mimeType,
            byteSize: inspected.byteSize, width: 0, height: 0,
          }],
        })
      } catch (error) {
        await Promise.allSettled([deps.storage.delete(storageKey)])
        await deps.repository.markFailed(id)
        throw error
      }
      const ready = await deps.repository.getReadyById(id)
      if (!ready) throw new Error('Ready media record was not found after upload')
      return toPublic(ready)
    },
    async listReady() { return Promise.all((await deps.repository.listReady()).map(toPublic)) },
    async getReadyById(id: string) {
      const record = await deps.repository.getReadyById(id)
      return record ? toPublic(record) : null
    },
    async deleteMedia(id: string) {
      const record = await deps.repository.prepareDelete(id)
      const keys = [...new Set(record.variants.map((variant) => variant.storageKey))]
      const deletions = await Promise.allSettled(keys.map((key) => deps.storage.delete(key)))
      if (deletions.some((result) => result.status === 'rejected')) {
        throw new Error('One or more media objects could not be deleted')
      }
      await deps.repository.deleteRecord(id)
    },
  }
}
