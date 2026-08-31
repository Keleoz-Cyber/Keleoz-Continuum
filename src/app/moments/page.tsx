import type { Metadata } from 'next'

import { getCachedPublicMoments } from '@/modules/content/cache'
import { PublicMoments } from '@/modules/content/public-moments'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export const metadata: Metadata = { title: 'Moments', description: 'Short traces from Keleoz Continuum.' }
export const dynamic = 'force-dynamic'
export default async function MomentsPage() { const items = await getCachedPublicMoments(); return <main className="source-public-page source-moments-page"><div className="source-public-bg" aria-hidden="true" /><SourcePublicNav current="moments" /><section className="source-page active"><header className="module-intro"><div className="module-intro-top"><h1>Moments</h1><span className="module-intro-sub">CIRCLE · 动态</span></div><div className="module-intro-rule" /><p className="module-intro-desc">短暂的想法、照片与近况，按时间留在这里。</p></header><PublicMoments items={items} /></section></main> }
