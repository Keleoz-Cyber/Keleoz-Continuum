'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { PublicContentListItem } from '@/modules/content/dto'

export function BlogListClient({ items }: { items: PublicContentListItem[] }) {
  const [query, setQuery] = useState('')
  const [settledQuery, setSettledQuery] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledQuery(query.trim().toLowerCase()), 160)
    return () => window.clearTimeout(timer)
  }, [query])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = category === 'All' || item.categoryLabel === category
      const matchesQuery = !settledQuery || [item.title, item.subtitle, item.categoryLabel, item.summary]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(settledQuery)
      return matchesCategory && matchesQuery
    })
  }, [category, items, settledQuery])

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categoryLabel).filter((value): value is string => Boolean(value)))),
    [items],
  )

  const totalBytes = useMemo(() => new Blob([JSON.stringify(items)]).size, [items])

  return (
    <section className="blog-reference-module">
      <div className="reference-module-intro">
        <div className="reference-module-top"><h1>Blog</h1><span>Personal journal system</span></div>
        <div className="reference-module-rule" />
        <p>创作空间。记录日志、项目、思考与仍在形成的故事。<br />公开内容会从这里慢慢延伸出去，成为 Continuum 的一部分。</p>
      </div>
      <div className="blog-reference-layout">
        <aside className="blog-reference-side">
          <p className="blog-reference-stats">{items.length} 篇日志 · {(totalBytes / 1024).toFixed(1)} KB</p>
          <div className="blog-reference-rule" />
          <div className="blog-reference-categories" aria-label="Blog categories">
            <button type="button" className={category === 'All' ? 'is-active' : ''} onClick={() => setCategory('All')}>All</button>
            {categories.map((itemCategory) => <button type="button" className={category === itemCategory ? 'is-active' : ''} key={itemCategory} onClick={() => setCategory(itemCategory)}>{itemCategory}</button>)}
          </div>
          <div className="blog-reference-rule" />
          <div className="blog-reference-actions">
            <Link href="/studio/login">+ 写日志</Link>
            <span className="is-disabled">+ 分类</span>
            <span className="is-disabled">密码日志</span>
          </div>
        </aside>
        <div className="blog-reference-main">
          <label className="blog-reference-search"><span>⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、副标题、分类或内容…" /></label>
          <div className="blog-reference-list" aria-live="polite">
            {filteredItems.length ? filteredItems.map((item) => {
              const date = new Date(item.publishedAt)
              return <Link href={`/blog/${item.slug}`} key={item.slug} className="reference-post-card">
                <time dateTime={item.publishedAt} className="reference-post-date"><strong>{date.getDate()}</strong><span>{date.toLocaleDateString('en', { month: 'short', year: '2-digit' })}</span></time>
                <span className="reference-post-copy"><strong>{item.title}</strong>{item.subtitle ? <em>{item.subtitle}</em> : null}<span>{item.summary || 'No public summary.'}</span><small>{item.categoryLabel || 'Writing'}</small></span>
                <span className="reference-post-arrow" aria-hidden="true">↗</span>
              </Link>
            }) : <div className="blog-reference-empty"><span>⌁</span><p>还没有公开日志，点击“写日志”开始记录。</p></div>}
          </div>
        </div>
      </div>
    </section>
  )
}
