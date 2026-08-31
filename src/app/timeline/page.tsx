import type { Metadata } from 'next'
import Link from 'next/link'

import { getCachedPublicTimeline } from '@/modules/content/cache'
import { contentPublicPath, type ContentType } from '@/modules/content/routing'
import { groupTimelineItems } from '@/modules/continuity/contracts'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Timeline', description: 'Published traces across Keleoz Continuum.' }

const filters: Array<{ value: ContentType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'blog', label: 'Blog' },
  { value: 'project', label: 'Projects' },
  { value: 'moment', label: 'Moments' },
  { value: 'page', label: 'Pages' },
]

export default async function TimelinePage({ searchParams }: {
  searchParams: Promise<{ view?: string | string[]; type?: string | string[] }>
}) {
  const params = await searchParams
  const view = params.view === 'archive' ? 'archive' : 'timeline'
  const requestedType = typeof params.type === 'string' ? params.type : 'all'
  const type = filters.some((filter) => filter.value === requestedType) ? requestedType as ContentType | 'all' : 'all'
  const items = await getCachedPublicTimeline()
  const visible = type === 'all' ? items : items.filter((item) => item.type === type)
  const groups = groupTimelineItems(visible)
  const queryFor = (nextView: 'timeline' | 'archive', nextType = type) => {
    const query = new URLSearchParams()
    if (nextView === 'archive') query.set('view', 'archive')
    if (nextType !== 'all') query.set('type', nextType)
    const suffix = query.toString()
    return `/timeline${suffix ? `?${suffix}` : ''}`
  }

  return (
    <main className={`source-public-page continuity-page ${view === 'archive' ? 'archive-view' : ''}`}>
      <div className="source-public-bg" aria-hidden="true" />
      <SourcePublicNav current="timeline" />
      <section className="source-page active">
        <header className="module-intro continuity-intro">
          <div className="module-intro-top"><h1>Timeline</h1><span className="module-intro-sub">CONTINUITY · 时间线</span></div>
          <div className="module-intro-rule" />
          <p className="module-intro-desc">Blog、Projects、Moments 与 Pages 的公开痕迹在同一条时间线上自然汇聚。</p>
        </header>
        <nav className="continuity-modes" aria-label="Timeline views">
          <Link className={view === 'timeline' ? 'active' : ''} href={queryFor('timeline')}>Timeline</Link>
          <Link className={view === 'archive' ? 'active' : ''} href={queryFor('archive')}>Archive</Link>
          <span>{view === 'archive' ? 'Archive · 长期回看' : `${visible.length} traces`}</span>
        </nav>
        <nav className="continuity-filters" aria-label="Content type filters">
          {filters.map((filter) => <Link className={type === filter.value ? 'active' : ''} href={queryFor(view, filter.value)} key={filter.value}>{filter.label}</Link>)}
        </nav>
        {groups.length === 0 ? <div className="continuity-empty">时间线上还没有公开内容。</div> : (
          <div className="continuity-years">
            {groups.map((year) => (
              <section className="continuity-year" key={year.year}>
                <h2>{year.year}</h2>
                {year.months.map((month) => (
                  <div className="continuity-month" key={month.key}>
                    <div className="continuity-rail" aria-hidden="true"><i /><span>{month.label}</span></div>
                    <div className="continuity-month-items">
                      {month.items.map((item) => (
                        <Link className="continuity-item" href={contentPublicPath(item.type, item.slug)} key={`${item.type}:${item.slug}`}>
                          <i className={`continuity-node type-${item.type}`} aria-hidden="true" />
                          <div><small>{item.type} · {new Date(item.publishedAt).toLocaleDateString('zh-CN')}</small><h3>{item.title}</h3>{item.summary ? <p>{item.summary}</p> : null}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
