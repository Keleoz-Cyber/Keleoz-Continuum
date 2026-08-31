import type { Metadata } from 'next'
import Link from 'next/link'

import { contentPublicPath, CONTENT_TYPE_CONFIG, type ContentType } from '@/modules/content/routing'
import { contentRepository } from '@/modules/content/runtime'
import { normalizePublicSearchQuery } from '@/modules/continuity/contracts'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Search', description: 'Search public Keleoz Continuum content.' }

export default async function SearchPage({ searchParams }: {
  searchParams: Promise<{ q?: string | string[]; type?: string | string[] }>
}) {
  const params = await searchParams
  const rawQuery = typeof params.q === 'string' ? params.q : ''
  const requestedType = typeof params.type === 'string' ? params.type : 'all'
  const type = ['blog', 'project', 'moment', 'page'].includes(requestedType) ? requestedType as ContentType : 'all'
  let query: string | null = null
  let error = ''
  try { query = normalizePublicSearchQuery(rawQuery) } catch (cause) { error = cause instanceof Error ? cause.message : '搜索词无效。' }
  let results = query ? await contentRepository.searchPublic(query).catch(() => []) : []
  if (type !== 'all') results = results.filter((result) => result.type === type)

  return (
    <main className="source-public-page search-page">
      <div className="source-public-bg" aria-hidden="true" />
      <SourcePublicNav current="search" />
      <section className="source-page active">
        <header className="module-intro"><div className="module-intro-top"><h1>Search</h1><span className="module-intro-sub">GLOBAL · 公开检索</span></div><div className="module-intro-rule" /><p className="module-intro-desc">检索公开的 Blog、Projects、Moments 与 Pages。Summary 与 Hidden 的正文不会进入结果。</p></header>
        <form className="global-search-form" action="/search" method="get" role="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
          <input aria-label="搜索公开内容" name="q" type="search" defaultValue={rawQuery} maxLength={80} placeholder="搜索标题、摘要与公开正文…" />
          <select aria-label="内容类型" name="type" defaultValue={type}><option value="all">All</option><option value="blog">Blog</option><option value="project">Projects</option><option value="moment">Moments</option><option value="page">Pages</option></select>
          <button type="submit">Search</button>
        </form>
        {error ? <p className="global-search-note error">{error}</p> : query ? <p className="global-search-note">{results.length} results for “{rawQuery.trim()}”</p> : <p className="global-search-note">输入至少两个字符开始检索。</p>}
        <div className="global-search-results">
          {results.map((result) => <Link href={contentPublicPath(result.type, result.slug)} key={`${result.type}:${result.slug}`}><small>{CONTENT_TYPE_CONFIG[result.type].singular}</small><h2>{result.title}</h2>{result.subtitle ? <em>{result.subtitle}</em> : null}<p>{result.snippet || result.summary}</p><time dateTime={result.publishedAt}>{new Date(result.publishedAt).toLocaleDateString('zh-CN')}</time></Link>)}
        </div>
      </section>
    </main>
  )
}
