import 'server-only'

import { unstable_cache } from 'next/cache'

import { contentRepository } from '@/modules/content/runtime'

export function getCachedPublicList(type: 'blog' | 'project' | 'moment' | 'page') {
  return unstable_cache(
    () => contentRepository.listPublic(type),
    ['public-content-list', type],
    { tags: [`content:${type}`], revalidate: 3_600 },
  )()
}

export function getCachedPublicBySlug(slug: string) {
  return unstable_cache(
    () => contentRepository.getPublicBySlug(slug),
    ['public-content-detail', slug],
    { tags: ['content:blog', `content:blog:${slug}`], revalidate: 3_600 },
  )()
}
