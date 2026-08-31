import { SourceHomeFrame } from '@/modules/home/source-home-frame'
import { PublicHomeSections } from '@/modules/home/public-home-sections'
import { loadHomePublicData } from '@/modules/home/public-home-data'
import { getCachedPublicBySlug, getCachedPublicList, getCachedPublicTimeline } from '@/modules/content/cache'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const data = await loadHomePublicData({ list: getCachedPublicList, timeline: getCachedPublicTimeline, detail: getCachedPublicBySlug })
  return <main className="continuum-home"><SourceHomeFrame /><PublicHomeSections data={data} /></main>
}
