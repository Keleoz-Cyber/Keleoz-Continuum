import { notFound } from 'next/navigation'

import { contentRepository } from '@/modules/content/runtime'
import type { DraftSnapshot } from '@/modules/content/schemas'
import { BlogEditorShell } from '@/modules/editor/blog-editor-shell'
import type { EditorMediaItem } from '@/modules/editor/media-nodes'
import type { EditorContentReference } from '@/modules/editor/advanced-nodes'
import type { EditorContentVersion } from '@/modules/editor/content-version-history'
import { mediaService } from '@/modules/media/runtime'
import { parseAndRenderDocument } from '@/modules/content/document'
import { sourceAttachments } from '@/modules/source-native/posts'
import { readSourceCategories } from '@/modules/source-native/repository'

export default async function StudioContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [draft, media, references, versions, categories] = await Promise.all([
    contentRepository.getDraftById(id),
    mediaService.listReady(),
    contentRepository.listTimeline(),
    contentRepository.listVersions(id),
    readSourceCategories(),
  ])
  if (!draft) notFound()
  const initialSnapshot: DraftSnapshot = {
    title: draft.title,
    subtitle: draft.subtitle,
    categoryLabel: draft.categoryLabel,
    summary: draft.summary,
    exposure: draft.exposure,
    document: draft.document as DraftSnapshot['document'],
  }
  const sourceConversion = initialSnapshot.document.attrs?.sourceFormat ? {
    html:parseAndRenderDocument({...initialSnapshot.document,attrs:{...initialSnapshot.document.attrs,sourceMedia:false}}).html,
    attachments:sourceAttachments(initialSnapshot.document),
  } : undefined

  return (
      <BlogEditorShell
        entryId={draft.id}
        slug={draft.slug}
        revision={draft.revision}
        initialSnapshot={initialSnapshot}
        sourceConversion={sourceConversion}
        categories={categories}
        media={media.map((item): EditorMediaItem => ({ id: item.id, altText: item.altText, originalName: item.originalName, kind: item.kind }))}
        references={references.map((item): EditorContentReference => ({ type: item.type, slug: item.slug, title: item.title, summary: item.summary }))}
        versions={versions.map((version): EditorContentVersion => ({ ...version, createdAt: version.createdAt.toISOString() }))}
      />
  )
}
