import type { Metadata } from 'next'

import { getCachedPublicList } from '@/modules/content/cache'
import { PublicProjects } from '@/modules/content/public-projects'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export const metadata: Metadata = { title: 'Projects', description: 'Projects growing inside Keleoz Continuum.' }
export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const items = await getCachedPublicList('project')
  return <main className="source-public-page source-projects-page"><div className="source-public-bg" aria-hidden="true" /><SourcePublicNav current="projects" /><section className="source-page active"><header className="module-intro"><div className="module-intro-top"><h1>Projects</h1><span className="module-intro-sub">ONGOING WORKS</span></div><div className="module-intro-rule" /><p className="module-intro-desc">有状态、有时间，也会持续更新的项目记录。</p></header><PublicProjects items={items} /></section></main>
}
