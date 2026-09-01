import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import COS from 'cos-nodejs-sdk-v5'

export type MediaStoragePut = { key: string; bytes: Buffer; mimeType: string; contentDisposition?: string }
export type MediaStorage = {
  put(input: MediaStoragePut): Promise<void>
  delete(key: string): Promise<void>
  read?(key: string): Promise<Buffer>
  publicUrl(key: string): string
}

function validateKey(key: string) {
  if (!/^[a-z0-9][a-z0-9/._-]*$/.test(key) || key.includes('..') || key.includes('\\')) {
    throw new Error('Invalid media storage key')
  }
  return key
}

function encodedKey(key: string) {
  return validateKey(key).split('/').map(encodeURIComponent).join('/')
}

export function createLocalMediaStorage({ root }: { root: string }): MediaStorage & { read(key: string): Promise<Buffer> } {
  const absoluteRoot = path.resolve(root)
  function resolveKey(key: string) {
    const target = path.resolve(absoluteRoot, ...validateKey(key).split('/'))
    if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) {
      throw new Error('Invalid media storage key')
    }
    return target
  }
  return {
    async put(input) {
      const target = resolveKey(input.key)
      await mkdir(path.dirname(target), { recursive: true })
      const temporary = `${target}.${randomUUID()}.tmp`
      try {
        await writeFile(temporary, input.bytes, { flag: 'wx' })
        await rename(temporary, target)
      } catch (error) {
        await rm(temporary, { force: true })
        throw error
      }
    },
    async delete(key) { await rm(resolveKey(key), { force: true }) },
    async read(key) { return readFile(resolveKey(key)) },
    publicUrl(key) { return `/media/object/${encodedKey(key)}` },
  }
}

type CosLike = {
  putObject(input: Record<string, unknown>): Promise<unknown>
  deleteObject(input: Record<string, unknown>): Promise<unknown>
}
type CosConstructor = new (options: Record<string, unknown>) => CosLike

export function createLightCosMediaStorage(config: {
  secretId: string
  secretKey: string
  bucket: string
  publicOrigin: string
  Cos?: CosConstructor
}): MediaStorage {
  const publicOrigin = new URL(config.publicOrigin)
  if (!['http:', 'https:'].includes(publicOrigin.protocol) || publicOrigin.pathname !== '/') {
    throw new Error('LightCOS public origin must be an HTTP(S) origin')
  }
  const Cos = config.Cos ?? (COS as unknown as CosConstructor)
  const client = new Cos({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
    Domain: '{Bucket}.light-cos.com',
    Protocol: 'https:',
    CompatibilityMode: true,
  })
  const base = { Bucket: config.bucket, Region: 'lightcos' }
  return {
    async put(input) {
      await client.putObject({
        ...base,
        Key: validateKey(input.key),
        Body: input.bytes,
        ContentLength: input.bytes.length,
        ContentType: input.mimeType,
        ...(input.contentDisposition ? { ContentDisposition: input.contentDisposition } : {}),
        CacheControl: 'public,max-age=31536000,immutable',
      })
    },
    async delete(key) { await client.deleteObject({ ...base, Key: validateKey(key) }) },
    publicUrl(key) { return new URL(encodedKey(key), publicOrigin).toString() },
  }
}
