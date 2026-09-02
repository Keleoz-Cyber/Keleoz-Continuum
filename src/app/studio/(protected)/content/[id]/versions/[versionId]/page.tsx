import Link from 'next/link'
import { notFound } from 'next/navigation'

import { restoreContentVersionAction } from '@/modules/content/actions'
import { CONTENT_TYPE_CONFIG, studioContentPath } from '@/modules/content/routing'
import { contentRepository } from '@/modules/content/runtime'

export default async function ContentVersionPreviewPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>
}) {
  const { id, versionId } = await params
  const [draft, version] = await Promise.all([
    contentRepository.getDraftById(id),
    contentRepository.getVersionById({ entryId: id, versionId }),
  ])
  if (!draft || !version) notFound()
  const config = CONTENT_TYPE_CONFIG[version.type]

  return (
    <main className="studio-main version-preview-page">
      <header className="editor-page-header">
        <div>
          <p className="eyebrow">{config.singular} · Publication history</p>
          <h1>Version {version.versionNumber}</h1>
        </div>
        <div className="editor-actions">
          <Link href={studioContentPath(id)}>Back to draft</Link>
          <form action={restoreContentVersionAction}>
            <input name="entryId" type="hidden" value={id} />
            <input name="versionId" type="hidden" value={version.id} />
            <input name="expectedRevision" type="hidden" value={draft.revision} />
            <button type="submit">Restore to draft</button>
          </form>
        </div>
      </header>
      <article className="version-preview-card">
        <header>
          <span>Version {version.versionNumber}</span>
          <span>{version.exposure}</span>
          <time dateTime={version.createdAt.toISOString()}>{version.createdAt.toLocaleString('zh-CN')}</time>
        </header>
        <p className="version-preview-note">Owner historical view · 此处显示当时保存的完整版本；公开可见范围仍由该版本的 Exposure 决定。</p>
        <h2>{version.title}</h2>
        {version.subtitle ? <p className="version-preview-subtitle">{version.subtitle}</p> : null}
        <div className="editor-surface version-preview-content" dangerouslySetInnerHTML={{ __html: version.renderedHtml }} />
      </article>
    </main>
  )
}
