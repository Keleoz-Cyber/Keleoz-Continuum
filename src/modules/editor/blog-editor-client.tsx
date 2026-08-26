'use client'

import { useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'

import { getContinuumExtensions } from '@/modules/content/extensions'
import type { DraftSnapshot, TiptapDocument } from '@/modules/content/schemas'
import { useDraftAutosave } from '@/modules/editor/use-draft-autosave'

export function BlogEditorClient(props: {
  entryId: string
  slug: string
  revision: number
  initialSnapshot: DraftSnapshot
}) {
  const [title, setTitle] = useState(props.initialSnapshot.title)
  const [subtitle, setSubtitle] = useState(props.initialSnapshot.subtitle ?? '')
  const [categoryLabel, setCategoryLabel] = useState(props.initialSnapshot.categoryLabel ?? '')
  const [summary, setSummary] = useState(props.initialSnapshot.summary)
  const [exposure, setExposure] = useState(props.initialSnapshot.exposure)
  const [document, setDocument] = useState<TiptapDocument>(props.initialSnapshot.document)
  const extensions = useMemo(() => getContinuumExtensions(), [])
  const editor = useEditor({
    extensions,
    content: props.initialSnapshot.document,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setDocument(currentEditor.getJSON() as TiptapDocument)
    },
  })
  const snapshot = useMemo<DraftSnapshot>(
    () => ({
      title,
      subtitle: subtitle.trim() || null,
      categoryLabel: categoryLabel.trim() || null,
      summary,
      exposure,
      document,
    }),
    [categoryLabel, document, exposure, subtitle, summary, title],
  )
  const autosave = useDraftAutosave({
    entryId: props.entryId,
    initialRevision: props.revision,
    snapshot,
  })

  return (
    <section className="blog-editor">
      <div className="editor-meta-grid">
        <label>
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          <span>Subtitle</span>
          <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
        </label>
        <label>
          <span>Collection label</span>
          <input value={categoryLabel} onChange={(event) => setCategoryLabel(event.target.value)} />
        </label>
        <label>
          <span>Exposure</span>
          <select
            value={exposure}
            onChange={(event) => setExposure(event.target.value as DraftSnapshot['exposure'])}
          >
            <option value="full">Full</option>
            <option value="summary">Summary</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>
      <label className="editor-summary">
        <span>Public summary</span>
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
      </label>
      <div className="editor-slug">/{props.slug}</div>
      <div className="editor-surface">
        <EditorContent editor={editor} />
      </div>
      <div className="editor-status" data-state={autosave.state}>
        <span>{autosave.state}</span>
        <span>Revision {autosave.revision}</span>
        {autosave.state === 'error' || autosave.state === 'conflict' ? (
          <button onClick={autosave.retry} type="button">
            Retry
          </button>
        ) : null}
      </div>
    </section>
  )
}
