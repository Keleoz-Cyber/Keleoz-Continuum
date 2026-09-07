import { SourceHomeFrame } from '@/modules/home/source-home-frame'
import { PublicHomeSections } from '@/modules/home/public-home-sections'
import { loadHomePublicData } from '@/modules/home/public-home-data'
import { getCachedPublicBySlug, getCachedPublicList, getCachedPublicTimeline } from '@/modules/content/cache'
import { getPublicSiteConfig } from '@/modules/site-config/runtime'
import { homeCanvasUrl } from '@/modules/home/delivery'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [data,settings] = await Promise.all([loadHomePublicData({ list: getCachedPublicList, timeline: getCachedPublicTimeline, detail: getCachedPublicBySlug }),getPublicSiteConfig()])
  return <main className="continuum-home"><link rel="preload" as="image" fetchPriority="high" media="(min-width: 901px)" href={settings.appearance.desktop.canvas || homeCanvasUrl}/><SourceHomeFrame settings={settings}/><PublicHomeSections data={data} /><footer className="continuum-filing"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">皖ICP备2026007914号-2</a></footer></main>
}
