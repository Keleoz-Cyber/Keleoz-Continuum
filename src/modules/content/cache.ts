import 'server-only'

import { unstable_cache } from 'next/cache'

import { contentRepository } from '@/modules/content/runtime'
import type { ContentType } from '@/modules/content/routing'

export function getCachedPublicList(type: ContentType) {
  return unstable_cache(
    () => contentRepository.listPublic(type),
    ['public-content-list-v4', type],
    { tags: [`content:${type}`], revalidate: 3_600 },
  )()
}

export function getCachedPublicBySlug(type: ContentType, slug: string) {
  return unstable_cache(
    () => contentRepository.getPublicBySlug(type, slug),
    ['public-content-detail-v4', type, slug],
    { tags: [`content:${type}`, `content:${type}:${slug}`], revalidate: 3_600 },
  )()
}
