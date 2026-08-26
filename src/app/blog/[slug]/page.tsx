import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getCachedPublicBySlug, getCachedPublicList } from '@/modules/content/cache'
import { ReadingProgress } from '@/modules/content/reading-progress'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getCachedPublicBySlug(slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.summary || article.subtitle || undefined,
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [article, list] = await Promise.all([
    getCachedPublicBySlug(slug),
    getCachedPublicList('blog'),
  ])
  if (!article) notFound()
  const index = list.findIndex((item) => item.slug === article.slug)
  const previous = index > 0 ? list[index - 1] : null
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null

  return (
    <main className="reader-page reader-reference-page">
      <ReadingProgress />
      <nav className="reader-context-nav"><Link href="/">Continuum</Link><span> / </span><Link href="/blog">Blog</Link></nav>
      <header className="reader-header">
        <p className="eyebrow">{article.categoryLabel ?? 'Writing'}</p>
        <h1>{article.title}</h1>
        {article.subtitle ? <p className="reader-subtitle">{article.subtitle}</p> : null}
        <time dateTime={article.publishedAt}>
          {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
        </time>
      </header>
      {article.exposure === 'summary' ? (
        <section className="reader-summary">
          <p>{article.summary}</p>
          <small>完整内容未公开</small>
        </section>
      ) : (
        <article
          className="reader-article"
          data-font-size="m"
          id="continuum-article"
          dangerouslySetInnerHTML={{ __html: article.bodyHtml ?? '' }}
        />
      )}
      <nav className="reader-adjacent" aria-label="Adjacent posts">
        {previous ? <Link href={`/blog/${previous.slug}`}>上一篇：{previous.title}</Link> : <span />}
        {next ? <Link href={`/blog/${next.slug}`}>下一篇：{next.title}</Link> : <span />}
      </nav>
    </main>
  )
}
