import type { Metadata } from 'next'

import { BlogListClient } from '@/modules/content/blog-list-client'
import { getCachedPublicList } from '@/modules/content/cache'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Writing from Keleoz Continuum.',
}

export default async function BlogPage() {
  const items = await getCachedPublicList('blog')

  return (
    <main className="blog-reference-page">
      <BlogListClient items={items} />
    </main>
  )
}
