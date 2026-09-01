import { notFound } from 'next/navigation'

import { BlogEditorShell } from '@/modules/editor/blog-editor-shell'
import { publishBlogAction } from '@/modules/content/actions'
import { contentRepository } from '@/modules/content/runtime'
import type { DraftSnapshot } from '@/modules/content/schemas'
import type { EditorMediaItem } from '@/modules/editor/media-nodes'
import { mediaService } from '@/modules/media/runtime'

export default async function StudioBlogEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [draft, media] = await Promise.all([
    contentRepository.getDraftById(id),
    mediaService.listReady(),
  ])
  if (!draft || draft.type !== 'blog') notFound()

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
        <div>
          <p className="eyebrow">Writing · Blog</p>
          <h1>{draft.title}</h1>
        </div>
        <div className="editor-actions">
          <a href={`/studio/blog/${draft.id}/preview`} target="_blank" rel="noreferrer">
            Guest Preview
          </a>
          <form action={publishBlogAction}>
            <input name="entryId" type="hidden" value={draft.id} />
            <button type="submit">Publish</button>
          </form>
        </div>
      </header>
      <BlogEditorShell
        entryId={draft.id}
        slug={draft.slug}
        revision={draft.revision}
        initialSnapshot={initialSnapshot}
        media={media.map((item): EditorMediaItem => ({ id: item.id, altText: item.altText, originalName: item.originalName }))}
      />
    </main>
  )
}
