'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { PublicContentListItem } from '@/modules/content/dto'

export function BlogListClient({ items }: { items: PublicContentListItem[] }) {
  const [query, setQuery] = useState('')
  const [settledQuery, setSettledQuery] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledQuery(query.trim().toLowerCase()), 160)
    return () => window.clearTimeout(timer)
  }, [query])

  const filteredItems = useMemo(() => {
    if (!settledQuery) return items
    return items.filter((item) =>
      [item.title, item.subtitle, item.categoryLabel, item.summary]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(settledQuery),
    )
  }, [items, settledQuery])

  return (
    <section className="blog-index-content">
      <label className="blog-filter">
        <span>Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标题、摘要或分类…"
        />
      </label>
      <div className="blog-list" aria-live="polite">
        {filteredItems.length ? (
          filteredItems.map((item) => {
            const date = new Date(item.publishedAt)
            return (
              <Link href={`/blog/${item.slug}`} key={item.slug} className="blog-list-item">
                <time dateTime={item.publishedAt} className="blog-list-date">
                  <strong>{date.getDate()}</strong>
                  <span>{date.toLocaleDateString('en', { month: 'short', year: '2-digit' })}</span>
                </time>
                <span className="blog-list-copy">
                  <strong>{item.title}</strong>
                  {item.subtitle ? <em>{item.subtitle}</em> : null}
                  <span>{item.summary || 'No public summary.'}</span>
                  {item.categoryLabel ? <small>{item.categoryLabel}</small> : null}
                </span>
              </Link>
            )
          })
        ) : (
          <p className="blog-empty">没有找到公开内容。</p>
        )}
      </div>
    </section>
  )
}
