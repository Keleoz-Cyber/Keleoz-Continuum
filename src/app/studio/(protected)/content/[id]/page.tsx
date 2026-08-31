import { notFound } from 'next/navigation'

import { publishContentAction } from '@/modules/content/actions'
import { CONTENT_TYPE_CONFIG } from '@/modules/content/routing'
import { contentRepository } from '@/modules/content/runtime'
import type { DraftSnapshot } from '@/modules/content/schemas'
import { BlogEditorShell } from '@/modules/editor/blog-editor-shell'

export default async function StudioContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await contentRepository.getDraftById(id)
  if (!draft) notFound()
  const config = CONTENT_TYPE_CONFIG[draft.type]
  const initialSnapshot: DraftSnapshot = {
    title: draft.title,
    subtitle: draft.subtitle,
    categoryLabel: draft.categoryLabel,
    summary: draft.summary,
    exposure: draft.exposure,
    document: draft.document as DraftSnapshot['document'],
  }

  return (
    <main className="studio-main editor-page">
      <header className="editor-page-header">
        <div><p className="eyebrow">Writing · {config.singular}</p><h1>{draft.title}</h1></div>
        <div className="editor-actions">
          <a href={`/studio/content/${draft.id}/preview`} target="_blank" rel="noreferrer">Guest Preview</a>
          <form action={publishContentAction}>
            <input name="entryId" type="hidden" value={draft.id} />
            <button type="submit">Publish</button>
          </form>
        </div>
      </header>
      <BlogEditorShell entryId={draft.id} slug={draft.slug} revision={draft.revision} initialSnapshot={initialSnapshot} />
    </main>
  )
}
