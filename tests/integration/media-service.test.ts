import sharp from 'sharp'
import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createMediaRepository } from '@/modules/media/repository'
import { createMediaService } from '@/modules/media/service'
import type { MediaStorage } from '@/modules/media/storage'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createMediaRepository(drizzle(pool, { schema }))

async function image() {
  return sharp({ create: { width: 1_200, height: 800, channels: 4, background: '#6f8fb6' } }).png().toBuffer()
}

function memoryStorage(failAfter = Number.POSITIVE_INFINITY) {
  const objects = new Map<string, Buffer>()
  const deleted: string[] = []
  let puts = 0
  const storage: MediaStorage = {
    async put(input) {
      puts += 1
      if (puts > failAfter) throw new Error('storage failed')
      objects.set(input.key, input.bytes)
    },
    async delete(key) { objects.delete(key); deleted.push(key) },
    publicUrl(key) { return `/media-test/${key}` },
  }
  return { storage, objects, deleted, get puts() { return puts } }
}

beforeEach(async () => {
  await pool.query('delete from content_media')
  await pool.query('delete from media_variants')
  await pool.query('delete from media_objects')
})
afterAll(async () => pool.end())

describe('media service', () => {
  it('stores six generated variants and exposes only ready library records', async () => {
    const memory = memoryStorage()
    const service = createMediaService({ repository, storage: memory.storage })
    const uploaded = await service.uploadImage({
      bytes: await image(), originalName: 'window.png', declaredMimeType: 'image/png',
      altText: '蓝色雾窗', now: new Date('2026-08-31T10:00:00Z'),
    })

    expect(uploaded).toMatchObject({ state: 'ready', originalName: 'window.png', altText: '蓝色雾窗', width: 1_200, height: 800 })
    expect(uploaded.variants).toHaveLength(6)
    expect(uploaded.variants.map((variant) => variant.publicUrl)).toEqual(expect.arrayContaining([
      expect.stringContaining('/thumb.webp'), expect.stringContaining('/card.webp'), expect.stringContaining('/large.avif'),
    ]))
    expect(memory.objects.size).toBe(6)
    await expect(service.listReady()).resolves.toEqual([expect.objectContaining({ id: uploaded.id, variants: expect.any(Array) })])
    await expect(repository.getReadyVariant(uploaded.id, 'large-webp')).resolves.toEqual(expect.objectContaining({
      mimeType: 'image/webp', storageKey: expect.stringContaining('/large.webp'),
    }))
  })

  it('marks a failed upload and removes every object written before the storage error', async () => {
    const memory = memoryStorage(2)
    const service = createMediaService({ repository, storage: memory.storage })

    await expect(service.uploadImage({
      bytes: await image(), originalName: 'failure.png', declaredMimeType: 'image/png',
      altText: '', now: new Date('2026-08-31T10:00:00Z'),
    })).rejects.toThrow('storage failed')

    expect(memory.objects.size).toBe(0)
    expect(memory.deleted).toHaveLength(2)
    const rows = await pool.query('select state from media_objects')
    expect(rows.rows).toEqual([{ state: 'failed' }])
    await expect(service.listReady()).resolves.toEqual([])
  })

  it('deduplicates an already-ready image by SHA-256 without uploading variants again', async () => {
    const bytes = await image()
    const memory = memoryStorage()
    const service = createMediaService({ repository, storage: memory.storage })
    const first = await service.uploadImage({ bytes, originalName: 'one.png', declaredMimeType: 'image/png', altText: 'one' })
    const second = await service.uploadImage({ bytes, originalName: 'two.png', declaredMimeType: 'image/png', altText: 'two' })

    expect(second.id).toBe(first.id)
    expect(memory.puts).toBe(6)
  })

  it('stores a verified non-image file as one original object without image dimensions', async () => {
    const memory = memoryStorage()
    const service = createMediaService({ repository, storage: memory.storage })
    const bytes = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVEfmt '), Buffer.alloc(32)])
    const uploaded = await service.uploadFile({
      bytes, originalName: 'ambient.wav', declaredMimeType: 'application/octet-stream', altText: 'Rain ambience',
      now: new Date('2026-09-01T10:00:00Z'),
    })

    expect(uploaded).toMatchObject({ kind: 'audio', mimeType: 'audio/wav', width: null, height: null })
    expect(uploaded.variants).toEqual([
      expect.objectContaining({ name: 'original', mimeType: 'audio/wav', publicUrl: expect.stringContaining('/original.wav') }),
    ])
    expect(memory.objects.size).toBe(1)
    await service.deleteMedia(uploaded.id)
    expect(memory.objects.size).toBe(0)
    await expect(service.listReady()).resolves.toEqual([])
  })
})
