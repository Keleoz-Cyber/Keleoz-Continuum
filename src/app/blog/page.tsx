import type { Metadata } from 'next'
import Link from 'next/link'

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
    <main className="blog-index-page">
      <header className="blog-index-header">
        <div>
          <p className="eyebrow">Writing · 书写</p>
          <h1>Blog</h1>
          <p>Long-form notes, records, and unfinished continuities.</p>
        </div>
        <Link className="foundation-link" href="/">
          Continuum
        </Link>
      </header>
      <BlogListClient items={items} />
    </main>
  )
}
