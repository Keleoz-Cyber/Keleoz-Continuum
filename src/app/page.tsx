import { HomeSceneSettings } from '@/modules/home/persistent-scene'
import { PublicHomeSections } from '@/modules/home/public-home-sections'
import { loadHomePublicData } from '@/modules/home/public-home-data'
import { getCachedPublicBySlug, getCachedPublicList, getCachedPublicTimeline } from '@/modules/content/cache'
import { getPublicSiteConfig } from '@/modules/site-config/runtime'
import { homeCanvasUrl } from '@/modules/home/delivery'
import { SourceAttribution } from '@/modules/home/source-attribution'

export const dynamic = 'force-dynamic'

export default async function HomePage({searchParams}:{searchParams:Promise<{openMusic?:string}>}) {
  const query=await searchParams
  const [data,settings] = await Promise.all([loadHomePublicData({ list: getCachedPublicList, timeline: getCachedPublicTimeline, detail: getCachedPublicBySlug }),getPublicSiteConfig()])
  return <main className="continuum-home"><link rel="preload" as="image" fetchPriority="high" media="(min-width: 901px)" href={settings.appearance.desktop.canvas || homeCanvasUrl}/><HomeSceneSettings settings={settings} openMusic={query.openMusic==='1'}/><PublicHomeSections data={data} /><SourceAttribution/></main>
}
