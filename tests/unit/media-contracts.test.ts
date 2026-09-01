import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import {
  MediaValidationError,
  buildMediaStorageKey,
  createImageVariants,
  inspectImageUpload,
} from '@/modules/media/contracts'

async function image(width = 1_200, height = 800) {
  return sharp({ create: { width, height, channels: 4, background: '#6f8fb6' } }).png().toBuffer()
}

describe('media upload contracts', () => {
  it('derives the real image type, dimensions, safe display name, and stable hash', async () => {
    const bytes = await image()
    const inspected = await inspectImageUpload({
      bytes,
      originalName: '..\\travel/雾窗.PNG',
      declaredMimeType: 'application/octet-stream',
    })

    expect(inspected).toMatchObject({
      originalName: '雾窗.PNG',
      mimeType: 'image/png',
      width: 1_200,
      height: 800,
      byteSize: bytes.length,
    })
    expect(inspected.sha256).toMatch(/^[a-f0-9]{64}$/)
  })

  it('rejects content that only claims to be an image', async () => {
    await expect(inspectImageUpload({
      bytes: Buffer.from('<script>alert(1)</script>'),
      originalName: 'photo.jpg',
      declaredMimeType: 'image/jpeg',
    })).rejects.toBeInstanceOf(MediaValidationError)
  })

  it('rejects oversized uploads before decoding and decompression-bomb dimensions after decoding', async () => {
    await expect(inspectImageUpload({
      bytes: Buffer.alloc(10 * 1024 * 1024 + 1),
      originalName: 'too-large.png',
      declaredMimeType: 'image/png',
    })).rejects.toThrow('10 MB')

    const huge = await image(8_000, 5_100)
    await expect(inspectImageUpload({
      bytes: huge,
      originalName: 'too-many-pixels.png',
      declaredMimeType: 'image/png',
    })).rejects.toThrow('40 megapixels')
  })

  it('creates bounded WebP and AVIF variants without upscaling', async () => {
    const variants = await createImageVariants(await image(1_200, 800))

    expect(variants.map(({ name, mimeType, width, height }) => ({ name, mimeType, width, height }))).toEqual([
      { name: 'thumb-webp', mimeType: 'image/webp', width: 320, height: 213 },
      { name: 'thumb-avif', mimeType: 'image/avif', width: 320, height: 213 },
      { name: 'card-webp', mimeType: 'image/webp', width: 960, height: 640 },
      { name: 'card-avif', mimeType: 'image/avif', width: 960, height: 640 },
      { name: 'large-webp', mimeType: 'image/webp', width: 1_200, height: 800 },
      { name: 'large-avif', mimeType: 'image/avif', width: 1_200, height: 800 },
    ])
    expect(variants.every((variant) => variant.bytes.length > 0)).toBe(true)
  })

  it('builds an ASCII-only random-key path that never contains the original filename', () => {
    const key = buildMediaStorageKey({
      mediaId: '4f9e2ed9-befd-44dd-8aa8-4ddf4987f011',
      variant: 'card-webp',
      now: new Date('2026-08-31T10:00:00Z'),
    })

    expect(key).toBe('media/2026/08/4f9e2ed9-befd-44dd-8aa8-4ddf4987f011/card.webp')
    expect(key).toMatch(/^[a-z0-9/.-]+$/)
  })
})
