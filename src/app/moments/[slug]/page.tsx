import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCachedPublicBySlug } from '@/modules/content/cache'
import { GuestCommentButton } from '@/modules/content/guest-comment-button'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = await getCachedPublicBySlug('moment', slug); return item ? { title: item.title, description: item.summary || undefined } : {} }
export default async function MomentPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = await getCachedPublicBySlug('moment', slug); if (!item) notFound(); return <main className="source-public-page source-moments-page"><div className="source-public-bg" aria-hidden="true" /><SourcePublicNav current="moments" /><section className="source-page active"><article className="source-moment-card source-moment-detail glass-card"><header><span className="source-moment-avatar">K</span><span className="source-moment-author"><strong>Keleoz</strong><small>@KeleozContinuum</small></span><i>/</i><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleString('zh-CN')}</time></header><h1>{item.title}</h1>{item.exposure === 'summary' ? <p>{item.summary}</p> : <div className="post-view-content" dangerouslySetInnerHTML={{ __html: item.bodyHtml ?? '' }} />}<footer><GuestCommentButton /></footer></article></section></main> }
