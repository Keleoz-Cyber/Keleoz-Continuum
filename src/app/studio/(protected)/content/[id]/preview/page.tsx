import { notFound } from 'next/navigation'

import { projectPublishedVersion } from '@/modules/content/projection'
import { CONTENT_TYPE_CONFIG } from '@/modules/content/routing'
import { contentRepository } from '@/modules/content/runtime'

export default async function GuestContentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await contentRepository.getDraftById(id)
  if (!draft) notFound()
  const projection = projectPublishedVersion({
    type: draft.type,
    slug: draft.slug,
    title: draft.title,
    subtitle: draft.subtitle,
    categoryLabel: draft.categoryLabel,
    summary: draft.summary,
    exposure: draft.exposure,
    renderedHtml: draft.html,
    publishedAt: draft.updatedAt,
  })
  if (!projection) return <main className="reader-page preview-hidden">Guest receives 404 for this Hidden draft.</main>

  return (
    <main className="reader-page">
      <p className="preview-label">Guest Preview · {CONTENT_TYPE_CONFIG[draft.type].singular}</p>
      <h1>{projection.title}</h1>
      {projection.subtitle ? <p className="reader-subtitle">{projection.subtitle}</p> : null}
      {projection.exposure === 'summary'
        ? <section className="reader-summary"><p>{projection.summary}</p><small>完整内容未公开</small></section>
        : <article dangerouslySetInnerHTML={{ __html: projection.bodyHtml ?? '' }} />}
    </main>
  )
}
