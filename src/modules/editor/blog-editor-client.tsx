'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'

import { getContinuumExtensions } from '@/modules/content/extensions'
import type { DraftSnapshot, TiptapDocument } from '@/modules/content/schemas'
import { useDraftAutosave } from '@/modules/editor/use-draft-autosave'
import { buildEditorGalleryNode, buildEditorImageNode, type EditorMediaItem } from '@/modules/editor/media-nodes'

export function BlogEditorClient(props: {
  entryId: string
  slug: string
  revision: number
  initialSnapshot: DraftSnapshot
  media: EditorMediaItem[]
}) {
  const [title, setTitle] = useState(props.initialSnapshot.title)
  const [subtitle, setSubtitle] = useState(props.initialSnapshot.subtitle ?? '')
  const [categoryLabel, setCategoryLabel] = useState(props.initialSnapshot.categoryLabel ?? '')
  const [summary, setSummary] = useState(props.initialSnapshot.summary)
  const [exposure, setExposure] = useState(props.initialSnapshot.exposure)
  const [document, setDocument] = useState<TiptapDocument>(props.initialSnapshot.document)
  const [mediaCaption, setMediaCaption] = useState('')
  const [mediaSize, setMediaSize] = useState<'compact' | 'content' | 'wide'>('content')
  const [galleryIds, setGalleryIds] = useState<string[]>([])
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

  const insertImage = (media: EditorMediaItem) => {
    if (!editor) return
    editor.chain().focus().insertContent([
      buildEditorImageNode(media, { caption: mediaCaption, size: mediaSize }),
      { type: 'paragraph' },
    ]).run()
    setMediaCaption('')
  }
  const insertGallery = () => {
    if (!editor) return
    const selected = galleryIds.flatMap((id) => {
      const media = props.media.find((item) => item.id === id)
      return media ? [media] : []
    })
    editor.chain().focus().insertContent([buildEditorGalleryNode(selected), { type: 'paragraph' }]).run()
    setGalleryIds([])
  }

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
        <aside className="editor-media-palette" aria-label="Media blocks">
          <header><div><span>Media blocks</span><small>正文只保存媒体 ID</small></div><a href="/studio#media-title">Manage library</a></header>
          {props.media.length ? <>
            <div className="editor-media-options"><label><span>Image size</span><select value={mediaSize} onChange={(event) => setMediaSize(event.target.value as typeof mediaSize)}><option value="compact">Compact</option><option value="content">Content</option><option value="wide">Wide</option></select></label><label><span>Caption</span><input value={mediaCaption} onChange={(event) => setMediaCaption(event.target.value)} maxLength={2_000} placeholder="可选图片说明" /></label></div>
            <div className="editor-media-list">{props.media.map((media) => <article key={media.id}>
              <Image src={`/media/${media.id}/thumb.webp`} alt={media.altText} width={320} height={213} unoptimized />
              <div><strong>{media.originalName}</strong><small>{media.altText || 'No alt text'}</small></div>
              <button type="button" onClick={() => insertImage(media)}>Insert image</button>
              <label><input type="checkbox" checked={galleryIds.includes(media.id)} disabled={!galleryIds.includes(media.id) && galleryIds.length >= 3} onChange={(event) => setGalleryIds((current) => event.target.checked ? [...current, media.id] : current.filter((id) => id !== media.id))} />Gallery</label>
            </article>)}</div>
            <div className="editor-media-actions"><button type="button" disabled={galleryIds.length < 2} onClick={insertGallery}>Insert gallery ({galleryIds.length}/3)</button><button type="button" onClick={() => editor?.chain().focus().deleteSelection().run()}>Remove selected block</button></div>
          </> : <p>媒体库为空。先返回 Studio 上传图片。</p>}
        </aside>
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
