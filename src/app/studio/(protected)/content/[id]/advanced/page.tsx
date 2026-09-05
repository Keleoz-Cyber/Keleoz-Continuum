import { notFound } from 'next/navigation'

import { publishContentAction } from '@/modules/content/actions'
import { CONTENT_TYPE_CONFIG } from '@/modules/content/routing'
import { contentRepository } from '@/modules/content/runtime'
import type { DraftSnapshot } from '@/modules/content/schemas'
import { BlogEditorShell } from '@/modules/editor/blog-editor-shell'
import type { EditorMediaItem } from '@/modules/editor/media-nodes'
import type { EditorContentReference } from '@/modules/editor/advanced-nodes'
import type { EditorContentVersion } from '@/modules/editor/content-version-history'
import { mediaService } from '@/modules/media/runtime'
import { parseAndRenderDocument } from '@/modules/content/document'
import { sourceAttachments } from '@/modules/source-native/posts'

export default async function StudioContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [draft, media, references, versions] = await Promise.all([
    contentRepository.getDraftById(id),
    mediaService.listReady(),
    contentRepository.listTimeline(),
    contentRepository.listVersions(id),
  ])
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
  const sourceConversion = initialSnapshot.document.attrs?.sourceFormat ? {
    html:parseAndRenderDocument({...initialSnapshot.document,attrs:{...initialSnapshot.document.attrs,sourceMedia:false}}).html,
    attachments:sourceAttachments(initialSnapshot.document),
  } : undefined

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
      {sourceConversion ? <p className="studio-notice">当前按原文格式载入。首次修改正文后会转为结构化块文档；只查看或返回不会转换。若只需写作或附加媒体，请返回原版编辑器。</p> : null}
      <BlogEditorShell
        entryId={draft.id}
        slug={draft.slug}
        revision={draft.revision}
        initialSnapshot={initialSnapshot}
        sourceConversion={sourceConversion}
        media={media.map((item): EditorMediaItem => ({ id: item.id, altText: item.altText, originalName: item.originalName, kind: item.kind }))}
        references={references.map((item): EditorContentReference => ({ type: item.type, slug: item.slug, title: item.title, summary: item.summary }))}
        versions={versions.map((version): EditorContentVersion => ({ ...version, createdAt: version.createdAt.toISOString() }))}
      />
    </main>
  )
}
