import { notFound } from 'next/navigation'
import { z } from 'zod'

import { mediaRepository, mediaStorage } from '@/modules/media/runtime'
import { contentDispositionForMedia } from '@/modules/media/contracts'
import { parseMediaByteRange } from '@/modules/media/http-range'

const variantSchema = z.string().regex(/^(original|(thumb|card|large)\.(webp|avif))$/)

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; variant: string }> },
) {
  const params = await context.params
  const mediaId = z.uuid().safeParse(params.id)
  const variantPath = variantSchema.safeParse(params.variant)
  if (!mediaId.success || !variantPath.success) notFound()
  const variantName = variantPath.data === 'original' ? 'original' : variantPath.data.replace('.', '-')
  const variant = await mediaRepository.getReadyVariant(mediaId.data, variantName)
  if (!variant) notFound()
  if (!mediaStorage.read) return Response.redirect(mediaStorage.publicUrl(variant.storageKey), 307)
  let bytes: Buffer
  try {
    bytes = await mediaStorage.read(variant.storageKey)
  } catch {
    notFound()
  }
  const rangeHeader = request.headers.get('range')
  let body = bytes
  let status = 200
  let contentRange: string | null = null
  if (rangeHeader) {
    try {
      const range = parseMediaByteRange(rangeHeader, bytes.length)
      body = bytes.subarray(range.start, range.end + 1)
      status = 206
      contentRange = `bytes ${range.start}-${range.end}/${bytes.length}`
    } catch {
      return new Response(null, {
        status: 416,
        headers: { 'accept-ranges': 'bytes', 'content-range': `bytes */${bytes.length}` },
      })
    }
  }
  return new Response(new Uint8Array(body), {
    status,
    headers: {
      'accept-ranges': 'bytes',
      'cache-control': 'public,max-age=31536000,immutable',
      'content-length': String(body.length),
      'content-type': variant.mimeType,
      'content-disposition': contentDispositionForMedia(variant.mimeType, variant.originalName),
      ...(contentRange ? { 'content-range': contentRange } : {}),
      'x-content-type-options': 'nosniff',
    },
  })
}
