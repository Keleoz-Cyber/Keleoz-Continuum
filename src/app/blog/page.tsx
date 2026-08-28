import type { Metadata } from 'next'

import { getOptionalCurrentOwner } from '@/modules/auth/dal'
import { BlogListClient } from '@/modules/content/blog-list-client'
import { getCachedPublicList } from '@/modules/content/cache'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Writing from Keleoz Continuum.',
}

export default async function BlogPage() {
  const [items, owner] = await Promise.all([
    getCachedPublicList('blog'),
    getOptionalCurrentOwner(),
  ])

  return <BlogListClient items={items} isOwner={Boolean(owner)} />
}
