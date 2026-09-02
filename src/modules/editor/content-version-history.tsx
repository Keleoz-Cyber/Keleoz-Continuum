'use client'

import Link from 'next/link'

import { restoreContentVersionAction } from '@/modules/content/actions'

export type EditorContentVersion = {
  id: string
  versionNumber: number
  title: string
  exposure: 'full' | 'summary' | 'hidden'
  createdAt: string
  isPublished: boolean
}

export function ContentVersionHistory(props: {
  entryId: string
  draftRevision: number
  versions: EditorContentVersion[]
}) {
  return (
    <section className="editor-version-history" aria-labelledby="version-history-title">
      <header>
        <div>
          <h2 id="version-history-title">Publication history</h2>
          <p>已发布版本保持不变。恢复只会复制到当前草稿，需再次发布才会影响公开页面。</p>
        </div>
        <span>{props.versions.length} versions</span>
      </header>
      {props.versions.length ? (
        <ol>
          {props.versions.map((version) => (
            <li key={version.id}>
              <div>
                <strong>Version {version.versionNumber}</strong>
                {version.isPublished ? <span className="version-current">Current public</span> : null}
                <small>{version.title} · {version.exposure} · {new Date(version.createdAt).toLocaleString('zh-CN')}</small>
              </div>
              <div className="version-actions">
                <Link href={`/studio/content/${props.entryId}/versions/${version.id}`}>Preview</Link>
                <form action={restoreContentVersionAction}>
                  <input name="entryId" type="hidden" value={props.entryId} />
                  <input name="versionId" type="hidden" value={version.id} />
                  <input name="expectedRevision" type="hidden" value={props.draftRevision} />
                  <button type="submit">Restore to draft</button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="editor-version-empty">首次发布后，版本记录会出现在这里。</p>}
    </section>
  )
}
