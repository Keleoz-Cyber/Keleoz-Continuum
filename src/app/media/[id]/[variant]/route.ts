import { notFound } from 'next/navigation'
import { z } from 'zod'

import { mediaRepository, mediaStorage } from '@/modules/media/runtime'

const variantSchema = z.string().regex(/^(thumb|card|large)\.(webp|avif)$/)

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; variant: string }> },
) {
  const params = await context.params
  const mediaId = z.uuid().safeParse(params.id)
  const variantPath = variantSchema.safeParse(params.variant)
  if (!mediaId.success || !variantPath.success) notFound()
  const variantName = variantPath.data.replace('.', '-')
  const variant = await mediaRepository.getReadyVariant(mediaId.data, variantName)
  if (!variant) notFound()
  if (!mediaStorage.read) return Response.redirect(mediaStorage.publicUrl(variant.storageKey), 307)
  let bytes: Buffer
  try {
    bytes = await mediaStorage.read(variant.storageKey)
  } catch {
    notFound()
  }
  return new Response(new Uint8Array(bytes), {
    headers: {
      'cache-control': 'public,max-age=31536000,immutable',
      'content-length': String(bytes.length),
      'content-type': variant.mimeType,
      'x-content-type-options': 'nosniff',
    },
  })
}
