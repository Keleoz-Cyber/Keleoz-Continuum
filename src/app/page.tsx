import { SourceHomeFrame } from '@/modules/home/source-home-frame'
import { PublicHomeSections } from '@/modules/home/public-home-sections'
import { loadHomePublicData } from '@/modules/home/public-home-data'
import { getCachedPublicBySlug, getCachedPublicList, getCachedPublicTimeline } from '@/modules/content/cache'
import { getPublicSiteConfig } from '@/modules/site-config/runtime'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [data,settings] = await Promise.all([loadHomePublicData({ list: getCachedPublicList, timeline: getCachedPublicTimeline, detail: getCachedPublicBySlug }),getPublicSiteConfig()])
  return <main className="continuum-home"><SourceHomeFrame settings={settings}/><PublicHomeSections data={data} /></main>
}
