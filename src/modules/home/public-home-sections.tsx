import Link from 'next/link'

import { contentPublicPath } from '@/modules/content/routing'
import type { HomePublicData } from './public-home-data'

export function PublicHomeSections({ data }: { data: HomePublicData }) {
  const focus = data.projects[0]
  return (
    <div className="continuum-home-sections">
      {focus ? <section className="home-focus"><p className="home-section-index">01 · Current Focus</p><Link href={`/projects/${focus.slug}`}><small>{focus.categoryLabel ?? 'Project'}</small><h2>{focus.title}</h2>{focus.subtitle ? <em>{focus.subtitle}</em> : null}<p>{focus.summary}</p><span>Open project →</span></Link></section> : null}
      {data.blogs.length ? <section className="home-writing"><header><p className="home-section-index">02 · Writing</p><h2>Recent writing</h2></header><div>{data.blogs.slice(0, 3).map((item, index) => <Link href={`/blog/${item.slug}`} key={item.slug}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3>{item.summary ? <p>{item.summary}</p> : null}</div><time>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</time></Link>)}</div></section> : null}
      {data.moments.length ? <section className="home-moments"><header><p className="home-section-index">03 · Moments</p><h2>Recent traces</h2></header><div>{data.moments.slice(0, 3).map((item) => <Link href={`/moments/${item.slug}`} key={item.slug}><small>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</small><h3>{item.title}</h3><p>{item.summary}</p></Link>)}</div></section> : null}
      <section className="home-experience"><header><p className="home-section-index">04 · Experience</p><h2>Experience</h2></header><div><Link href="/room"><small>Pixel space</small><h3>Room</h3><p>行走、换装、睡眠，以及 Tea、Story 与 Tarot。</p></Link><Link href="/letters"><small>Correspondence</small><h3>Letters</h3><p>留下一封匿名或署名来信。</p></Link><Link href="/?openMusic=1"><small>Browser local</small><h3>Music</h3><p>打开原项目的本地播放器。</p></Link></div></section>
      <section className="home-continuity"><div><p className="home-section-index">05 · Continuity</p><h2>Continuity</h2><p>{data.about?.summary || '一个持续生长的个人数字空间。'}</p><nav><Link href="/timeline">Timeline</Link><Link href="/timeline?view=archive">Archive</Link><Link href="/about">About</Link><Link href="/search">Search</Link></nav></div><ol>{data.timeline.slice(0, 4).map((item) => <li key={`${item.type}:${item.slug}`}><Link href={contentPublicPath(item.type, item.slug)}><time>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</time><span>{item.title}</span><small>{item.type}</small></Link></li>)}</ol></section>
    </div>
  )
}
