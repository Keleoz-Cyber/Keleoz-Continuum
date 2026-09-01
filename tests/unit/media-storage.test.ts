import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createLightCosMediaStorage, createLocalMediaStorage } from '@/modules/media/storage'

const temporaryRoots: string[] = []
afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('media storage drivers', () => {
  it('writes and reads local objects only inside the configured root', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'continuum-media-'))
    temporaryRoots.push(root)
    const storage = createLocalMediaStorage({ root })

    await storage.put({ key: 'media/2026/08/id/card.webp', bytes: Buffer.from('image'), mimeType: 'application/pdf', contentDisposition: "attachment; filename*=UTF-8''notes.pdf" })
    await expect(storage.read('media/2026/08/id/card.webp')).resolves.toEqual(Buffer.from('image'))
    await expect(readFile(path.join(root, 'media', '2026', '08', 'id', 'card.webp'))).resolves.toEqual(Buffer.from('image'))
    await expect(storage.put({ key: '../escape.webp', bytes: Buffer.from('bad'), mimeType: 'image/webp' })).rejects.toThrow('key')
  })

  it('uses the LightCOS object domain with server-only credentials and an encoded public origin', async () => {
    const constructorOptions: unknown[] = []
    const operations: Array<{ name: string; input: Record<string, unknown> }> = []
    class FakeCos {
      constructor(options: unknown) { constructorOptions.push(options) }
      async putObject(input: Record<string, unknown>) { operations.push({ name: 'put', input }); return {} }
      async deleteObject(input: Record<string, unknown>) { operations.push({ name: 'delete', input }); return {} }
    }
    const storage = createLightCosMediaStorage({
      secretId: 'server-secret-id', secretKey: 'server-secret-key',
      bucket: 'continuum-1250000000',
      publicOrigin: 'https://media.example.com',
      Cos: FakeCos,
    })

    await storage.put({ key: 'media/2026/08/id/card.webp', bytes: Buffer.from('image'), mimeType: 'application/pdf', contentDisposition: "attachment; filename*=UTF-8''notes.pdf" })
    await storage.delete('media/2026/08/id/card.webp')

    expect(constructorOptions).toEqual([expect.objectContaining({
      SecretId: 'server-secret-id', SecretKey: 'server-secret-key',
      Domain: '{Bucket}.light-cos.com', Protocol: 'https:', CompatibilityMode: true,
    })])
    expect(operations).toEqual([
      { name: 'put', input: expect.objectContaining({ Bucket: 'continuum-1250000000', Region: 'lightcos', Key: 'media/2026/08/id/card.webp', ContentType: 'application/pdf', ContentDisposition: "attachment; filename*=UTF-8''notes.pdf", CacheControl: 'public,max-age=31536000,immutable' }) },
      { name: 'delete', input: expect.objectContaining({ Bucket: 'continuum-1250000000', Region: 'lightcos', Key: 'media/2026/08/id/card.webp' }) },
    ])
    expect(storage.publicUrl('media/2026/08/id/card.webp')).toBe('https://media.example.com/media/2026/08/id/card.webp')
  })
})
