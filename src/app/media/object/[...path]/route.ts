import { notFound } from 'next/navigation'

import { mediaRepository, mediaStorage } from '@/modules/media/runtime'

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const storageKey = path.join('/')
  const variant = await mediaRepository.getReadyVariantByStorageKey(storageKey)
  if (!variant || !mediaStorage.read) notFound()
  let bytes: Buffer
  try {
    bytes = await mediaStorage.read(storageKey)
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
