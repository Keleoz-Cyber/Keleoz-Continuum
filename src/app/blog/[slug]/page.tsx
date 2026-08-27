import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getCachedPublicBySlug, getCachedPublicList } from '@/modules/content/cache'
import { ReadingProgress } from '@/modules/content/reading-progress'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

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
    <main className="source-public-page source-reader-page">
      <div className="source-public-bg" aria-hidden="true" />
      <SourcePublicNav current="blog" />
      <section className="source-page active" id="page-blog-reader">
        <div id="blog-read-view" className="fontsize-m">
          <ReadingProgress />
          <article className="post-view">
            <p className="post-view-kicker">{article.categoryLabel ?? 'Writing'}</p>
            <h1 className="post-view-title">{article.title}</h1>
            {article.subtitle ? <p className="post-view-sub">{article.subtitle}</p> : null}
            <div className="post-view-meta"><time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString('zh-CN')}</time><span>· Keleoz Continuum</span></div>
            {article.exposure === 'summary' ? <section className="post-view-summary"><p>{article.summary}</p><small>完整内容未公开</small></section> : <div className="post-view-content" id="continuum-article" dangerouslySetInnerHTML={{ __html: article.bodyHtml ?? '' }} />}
          </article>
          <nav className="brv-nav" aria-label="Adjacent posts">
            {previous ? <Link className="brv-nav-i" href={`/blog/${previous.slug}`}><span className="brv-nav-k">← 上一篇</span><span className="brv-nav-t">{previous.title}</span></Link> : <span className="brv-nav-i off" />}
            {next ? <Link className="brv-nav-i next" href={`/blog/${next.slug}`}><span className="brv-nav-t">{next.title}</span><span className="brv-nav-k">下一篇 →</span></Link> : <span className="brv-nav-i off" />}
          </nav>
        </div>
      </section>
    </main>
  )
}
