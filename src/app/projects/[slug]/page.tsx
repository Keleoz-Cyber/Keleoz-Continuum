import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCachedPublicBySlug } from '@/modules/content/cache'
import { GuestCommentButton } from '@/modules/content/guest-comment-button'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = await getCachedPublicBySlug('project', slug); return item ? { title: item.title, description: item.summary || undefined } : {} }
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const item = await getCachedPublicBySlug('project', slug); if (!item) notFound()
  return <main className="source-public-page source-reader-page source-project-reader"><div className="source-public-bg" aria-hidden="true" /><SourcePublicNav current="projects" /><section className="source-page active"><div id="blog-read-view"><article className="post-view"><p className="post-view-kicker">{item.categoryLabel ?? 'Project'}</p><h1 className="post-view-title">{item.title}</h1>{item.subtitle ? <p className="post-view-sub">{item.subtitle}</p> : null}<div className="post-view-meta"><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</time><span>· Keleoz Continuum</span></div>{item.exposure === 'summary' ? <section className="post-view-summary"><p>{item.summary}</p><small>完整内容未公开</small></section> : <div className="post-view-content" dangerouslySetInnerHTML={{ __html: item.bodyHtml ?? '' }} />}<footer className="source-content-interaction"><GuestCommentButton /></footer></article></div></section></main>
}
