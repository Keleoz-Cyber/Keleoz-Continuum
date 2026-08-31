import { notFound } from 'next/navigation'

import { getCachedPublicBySlug } from '@/modules/content/cache'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = await getCachedPublicBySlug('page', slug); if (!page) notFound(); return <main className="source-public-page source-reader-page"><div className="source-public-bg" aria-hidden="true" /><SourcePublicNav /><section className="source-page active"><div id="blog-read-view"><article className="post-view"><p className="post-view-kicker">Page</p><h1 className="post-view-title">{page.title}</h1>{page.exposure === 'summary' ? <section className="post-view-summary"><p>{page.summary}</p></section> : <div className="post-view-content" dangerouslySetInnerHTML={{ __html: page.bodyHtml ?? '' }} />}</article></div></section></main> }
