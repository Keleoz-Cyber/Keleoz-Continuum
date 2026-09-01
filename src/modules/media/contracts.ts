import { createHash } from 'node:crypto'
import path from 'node:path'

import sharp, { type Metadata } from 'sharp'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_INPUT_PIXELS = 40_000_000
const MIME_BY_FORMAT = {
  jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif',
} as const

export type MediaVariantName = 'thumb-webp' | 'thumb-avif' | 'card-webp' | 'card-avif' | 'large-webp' | 'large-avif'
export type ImageVariant = {
  name: MediaVariantName
  mimeType: 'image/webp' | 'image/avif'
  width: number
  height: number
  byteSize: number
  bytes: Buffer
}

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MediaValidationError'
  }
}

export async function inspectImageUpload(input: {
  bytes: Buffer
  originalName: string
  declaredMimeType: string
}) {
  if (input.bytes.length === 0) throw new MediaValidationError('Image file is empty')
  if (input.bytes.length > MAX_UPLOAD_BYTES) throw new MediaValidationError('Image must be 10 MB or smaller')
  let metadata: Metadata
  try {
    metadata = await sharp(input.bytes, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS }).metadata()
  } catch {
    throw new MediaValidationError('Image is invalid or exceeds 40 megapixels')
  }
  const mimeType = metadata.format && MIME_BY_FORMAT[metadata.format as keyof typeof MIME_BY_FORMAT]
  if (!mimeType || !metadata.width || !metadata.height) {
    throw new MediaValidationError('Unsupported or invalid image format')
  }
  if (metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new MediaValidationError('Image exceeds 40 megapixels')
  }
  const normalizedName = path.basename(input.originalName.replaceAll('\\', '/')).trim()
  return {
    originalName: normalizedName.slice(0, 255) || 'image',
    mimeType,
    width: metadata.width,
    height: metadata.height,
    byteSize: input.bytes.length,
    sha256: createHash('sha256').update(input.bytes).digest('hex'),
  }
}

export async function createImageVariants(bytes: Buffer): Promise<ImageVariant[]> {
  const definitions = [
    { size: 'thumb', width: 320, format: 'webp' }, { size: 'thumb', width: 320, format: 'avif' },
    { size: 'card', width: 960, format: 'webp' }, { size: 'card', width: 960, format: 'avif' },
    { size: 'large', width: 1_600, format: 'webp' }, { size: 'large', width: 1_600, format: 'avif' },
  ] as const
  const variants: ImageVariant[] = []
  for (const definition of definitions) {
    let pipeline = sharp(bytes, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width: definition.width, withoutEnlargement: true })
    pipeline = definition.format === 'webp'
      ? pipeline.webp({ quality: definition.size === 'thumb' ? 78 : 84 })
      : pipeline.avif({ quality: definition.size === 'thumb' ? 50 : 58, effort: 4 })
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
    variants.push({
      name: `${definition.size}-${definition.format}`,
      mimeType: `image/${definition.format}`,
      width: info.width,
      height: info.height,
      byteSize: data.length,
      bytes: data,
    })
  }
  return variants
}

export function buildMediaStorageKey(input: {
  mediaId: string
  variant: string
  now: Date
}): string {
  const match = /^(thumb|card|large)-(webp|avif)$/.exec(input.variant)
  if (!match) throw new MediaValidationError('Unknown media variant')
  const year = input.now.getUTCFullYear()
  const month = String(input.now.getUTCMonth() + 1).padStart(2, '0')
  return `media/${year}/${month}/${input.mediaId}/${match[1]}.${match[2]}`
}
