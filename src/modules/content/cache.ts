import 'server-only'

import { unstable_cache } from 'next/cache'

import { contentRepository } from '@/modules/content/runtime'
import type { ContentType } from '@/modules/content/routing'

export function getCachedPublicList(type: ContentType) {
  return unstable_cache(
    () => contentRepository.listPublic(type),
    ['public-content-list-v6', type],
    { tags: [`content:${type}`], revalidate: 3_600 },
  )()
}

export function getCachedPublicBySlug(type: ContentType, slug: string) {
  return unstable_cache(
    () => contentRepository.getPublicBySlug(type, slug),
    ['public-content-detail-v6', type, slug],
    { tags: [`content:${type}`, `content:${type}:${slug}`], revalidate: 3_600 },
  )()
}

export function getCachedPublicTimeline() {
  return unstable_cache(
    () => contentRepository.listTimeline(),
    ['public-content-timeline-v3'],
    { tags: ['content:timeline'], revalidate: 3_600 },
  )()
}
