import 'server-only'

import { unstable_cache } from 'next/cache'

import { contentRepository } from '@/modules/content/runtime'
import type { ContentType } from '@/modules/content/routing'
import { personaRepository } from '@/modules/persona/runtime'

export function getCachedPublicList(type: ContentType) {
  return unstable_cache(
    () => contentRepository.listPublic(type),
    ['public-content-list-v7', type],
    { tags: [`content:${type}`], revalidate: 3_600 },
  )()
}

export function getCachedPublicBySlug(type: ContentType, slug: string) {
  return unstable_cache(
    () => contentRepository.getPublicBySlug(type, slug),
    ['public-content-detail-v7', type, slug],
    { tags: [`content:${type}`, `content:${type}:${slug}`], revalidate: 3_600 },
  )()
}

export function getCachedPublicTimeline() {
  return unstable_cache(
    () => contentRepository.listTimeline(),
    ['public-content-timeline-v4'],
    { tags: ['content:timeline'], revalidate: 3_600 },
  )()
}

export function getCachedPublicMoments() {
  return unstable_cache(
    () => personaRepository.listPublicMoments(),
    ['public-moments-social-v2'],
    { tags: ['content:moment', 'moments:social'], revalidate: 3_600 },
  )()
}

export function getCachedPublicMomentBySlug(slug: string) {
  return unstable_cache(
    () => personaRepository.getPublicMomentBySlug(slug),
    ['public-moment-social-detail-v2', slug],
    { tags: ['content:moment', `content:moment:${slug}`, 'moments:social'], revalidate: 3_600 },
  )()
}
