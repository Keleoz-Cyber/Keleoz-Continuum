'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { PublicContentListItem } from '@/modules/content/dto'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export function BlogListClient({ items, isOwner }: { items: PublicContentListItem[]; isOwner: boolean }) {
  const [query, setQuery] = useState('')
  const [settledQuery, setSettledQuery] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledQuery(query.trim().toLowerCase()), 160)
    return () => window.clearTimeout(timer)
  }, [query])

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categoryLabel).filter((value): value is string => Boolean(value)))),
    [items],
  )
  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesCategory = category === 'All' || item.categoryLabel === category
    const haystack = [item.title, item.subtitle, item.categoryLabel, item.summary].filter(Boolean).join(' ').toLowerCase()
    return matchesCategory && (!settledQuery || haystack.includes(settledQuery))
  }), [category, items, settledQuery])
  const totalBytes = useMemo(() => new Blob([JSON.stringify(items)]).size, [items])

  return (
    <main className="source-public-page source-blog-page">
      <div className="source-public-bg" aria-hidden="true" />
      <SourcePublicNav current="blog" />
      <section className="source-page active" id="page-blog">
        <div id="blog-list-view">
          <div className="module-intro" id="blog-intro">
            <div className="module-intro-top"><h1>Blog</h1><span className="module-intro-sub">Personal journal system</span></div>
            <div className="module-intro-rule" />
            <div className="module-intro-desc">创作空间。长文、项目记录、随笔与仍在形成的故事都会从这里公开。<br />公开阅读沿用原日志系统的分类、搜索与卡片流，创作和权限由 Owner Studio 接管。</div>
          </div>
          <div className="blog-layout" id="blog-layout">
            <aside className="blog-side">
              <div className="blog-stats">{items.length} 篇日志 · {(totalBytes / 1024).toFixed(1)} KB</div>
              <div className="blog-side-rule" />
              <div className="category-bar" aria-label="日志分类">
                <button className={`cat-tag${category === 'All' ? ' active' : ''}`} type="button" onClick={() => setCategory('All')}>All</button>
                {categories.map((itemCategory) => <button className={`cat-tag${category === itemCategory ? ' active' : ''}`} type="button" key={itemCategory} onClick={() => setCategory(itemCategory)}>{itemCategory}</button>)}
              </div>
              {isOwner ? <><div className="blog-side-rule" /><div className="blog-actions">
                <Link className="btn btn-primary" href="/studio/write">+ 写日志</Link>
              </div></> : null}
            </aside>
            <div className="blog-main">
              <input className="blog-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、副标题、分类或内容…" />
              <div id="posts-container" aria-live="polite">
                {filteredItems.length ? filteredItems.map((item) => (
                  <Link className="post-card glass-card" href={`/blog/${item.slug}`} key={item.slug}>
                    <div className="post-card-title">{item.title}</div>
                    {item.subtitle ? <div className="post-card-sub">{item.subtitle}</div> : null}
                    <div className="post-card-preview">{item.summary || 'No public summary.'}</div>
                    <div className="post-card-meta"><span>{item.categoryLabel || 'Writing'}</span><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</time></div>
                  </Link>
                )) : <div className="empty-state"><span>✎</span>{query || category !== 'All' ? '没有找到符合条件的日志。' : '还没有公开日志。'}</div>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
