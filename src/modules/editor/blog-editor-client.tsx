'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/core'

import { getContinuumExtensions } from '@/modules/content/extensions'
import type { DraftSnapshot, TiptapDocument } from '@/modules/content/schemas'
import {
  canApplyEditorLink,
  editorTextSelectionRange,
  normalizeEditorLink,
  type EditorTextSelectionRange,
} from '@/modules/editor/formatting'
import { useDraftAutosave } from '@/modules/editor/use-draft-autosave'
import { moveTopLevelDocumentBlock, topLevelBlockIndexAtPosition } from '@/modules/editor/block-order'
import { ContentVersionHistory, type EditorContentVersion } from '@/modules/editor/content-version-history'
import {
  buildCalloutNode,
  buildCollapseNode,
  buildContentReferenceNode,
  buildTocNode,
  type EditorContentReference,
} from '@/modules/editor/advanced-nodes'
import {
  buildEditorAttachmentNode,
  buildEditorAudioNode,
  buildEditorGalleryNode,
  buildEditorImageNode,
  buildEditorVideoNode,
  type EditorMediaItem,
} from '@/modules/editor/media-nodes'

function FormatButton(props: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={props.active} disabled={props.disabled} onClick={props.onClick}>{props.label}</button>
}

function selectedTopLevelBlockIndex(editor: Editor) {
  const blocks: Array<{ offset: number; nodeSize: number }> = []
  editor.state.doc.forEach((node, offset) => blocks.push({ offset, nodeSize: node.nodeSize }))
  return topLevelBlockIndexAtPosition(blocks, editor.state.selection.from)
}

export function BlogEditorClient(props: {
  entryId: string
  slug: string
  revision: number
  initialSnapshot: DraftSnapshot
  media: EditorMediaItem[]
  references: EditorContentReference[]
  versions: EditorContentVersion[]
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
  const [calloutTone, setCalloutTone] = useState<'note' | 'tip' | 'warning'>('note')
  const [calloutTitle, setCalloutTitle] = useState('Note')
  const [collapseSummary, setCollapseSummary] = useState('Read more')
  const [tocTitle, setTocTitle] = useState('On this page')
  const [referenceKey, setReferenceKey] = useState(() => props.references[0] ? `${props.references[0].type}:${props.references[0].slug}` : '')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkSelection, setLinkSelection] = useState<EditorTextSelectionRange | null>(null)
  const [linkSelectionHasCode, setLinkSelectionHasCode] = useState(false)
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null)
  const extensions = useMemo(() => getContinuumExtensions(), [])
  const editor = useEditor({
    extensions,
    content: props.initialSnapshot.document,
    immediatelyRender: false,
    onCreate: ({ editor: currentEditor }) => setSelectedBlockIndex(selectedTopLevelBlockIndex(currentEditor)),
    onSelectionUpdate: ({ editor: currentEditor }) => setSelectedBlockIndex(selectedTopLevelBlockIndex(currentEditor)),
    onUpdate: ({ editor: currentEditor }) => {
      setDocument(currentEditor.getJSON() as TiptapDocument)
      setSelectedBlockIndex(selectedTopLevelBlockIndex(currentEditor))
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
  const insertNonImage = (media: EditorMediaItem) => {
    if (!editor) return
    const node = media.kind === 'audio' ? buildEditorAudioNode(media, mediaCaption)
      : media.kind === 'video' ? buildEditorVideoNode(media, mediaCaption)
        : buildEditorAttachmentNode(media, mediaCaption)
    editor.chain().focus().insertContent([node, { type: 'paragraph' }]).run()
    setMediaCaption('')
  }
  const insertAdvanced = (node: ReturnType<typeof buildCalloutNode>) => {
    editor?.chain().focus().insertContent([node, { type: 'paragraph' }]).run()
  }
  const normalizedLink = normalizeEditorLink(linkUrl)
  const canApplyLink = canApplyEditorLink(normalizedLink, linkSelection, linkSelectionHasCode)
  const applyLink = () => {
    if (!editor || !normalizedLink || !linkSelection || !canApplyLink) return
    editor.chain().focus().setTextSelection(linkSelection).setLink({ href: normalizedLink }).run()
    setLinkUrl(normalizedLink)
  }
  const removeLink = () => {
    if (!editor || !linkSelection) return
    editor.chain().focus().setTextSelection(linkSelection).unsetLink().run()
  }
  const blockCount = document.content?.length ?? 0
  const moveSelectedBlock = (direction: -1 | 1) => {
    if (!editor || selectedBlockIndex === null) return
    const moved = moveTopLevelDocumentBlock(document, selectedBlockIndex, direction)
    if (moved === document) return
    editor.commands.setContent(moved, { emitUpdate: false })
    setDocument(moved)
    setSelectedBlockIndex(selectedBlockIndex + direction)
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
        <div className="editor-format-toolbar" aria-label="Formatting tools">
          <FormatButton label="P" active={editor?.isActive('paragraph')} onClick={() => editor?.chain().focus().setParagraph().run()} />
          <FormatButton label="H2" active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
          <FormatButton label="H3" active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
          <FormatButton label="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} />
          <FormatButton label="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} />
          <FormatButton label="Strike" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} />
          <FormatButton label="Inline code" active={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()} />
          <FormatButton label="Quote" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
          <FormatButton label="• List" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
          <FormatButton label="1. List" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
          <FormatButton label="☑ Tasks" active={editor?.isActive('taskList')} onClick={() => editor?.chain().focus().toggleTaskList().run()} />
          <FormatButton label="Code block" active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} />
          <FormatButton label="Divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()} />
          <FormatButton label="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()} />
          <FormatButton label="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()} />
          <div className="editor-link-controls">
            <input aria-label="Link URL" aria-invalid={Boolean(linkUrl && !normalizedLink)} value={linkUrl} onFocus={() => { setLinkSelection(editor ? editorTextSelectionRange(editor.state.selection) : null); setLinkSelectionHasCode(Boolean(editor?.isActive('code'))) }} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://… or /path" />
            <button type="button" disabled={!canApplyLink} onClick={applyLink}>Apply link</button>
            <button type="button" disabled={!linkSelection} onClick={removeLink}>Remove link</button>
            {linkUrl && !normalizedLink ? <small role="status">Use http(s), mailto, /path or #anchor.</small> : null}
            {normalizedLink && !linkSelection ? <small role="status">Select text before focusing the link field.</small> : null}
            {normalizedLink && linkSelection && linkSelectionHasCode ? <small role="status">Inline code and Link cannot be combined.</small> : null}
          </div>
        </div>
        <div className="editor-block-order-controls" aria-label="Block ordering">
          <span>{selectedBlockIndex === null ? 'Select a block' : `Block ${selectedBlockIndex + 1} of ${blockCount}`}</span>
          <button type="button" disabled={selectedBlockIndex === null || selectedBlockIndex === 0} onClick={() => moveSelectedBlock(-1)}>Move up</button>
          <button type="button" disabled={selectedBlockIndex === null || selectedBlockIndex >= blockCount - 1} onClick={() => moveSelectedBlock(1)}>Move down</button>
        </div>
        <aside className="editor-advanced-palette" aria-label="Advanced blocks">
          <header><span>Advanced blocks</span><small>提示、折叠、引用与自动目录</small></header>
          <div className="editor-advanced-grid">
            <div><select aria-label="Callout tone" value={calloutTone} onChange={(event) => setCalloutTone(event.target.value as typeof calloutTone)}><option value="note">Note</option><option value="tip">Tip</option><option value="warning">Warning</option></select><input aria-label="Callout title" value={calloutTitle} maxLength={240} onChange={(event) => setCalloutTitle(event.target.value)} /><button type="button" onClick={() => insertAdvanced(buildCalloutNode(calloutTone, calloutTitle))}>Insert callout</button></div>
            <div><input aria-label="Collapse summary" value={collapseSummary} maxLength={240} onChange={(event) => setCollapseSummary(event.target.value)} /><button type="button" onClick={() => insertAdvanced(buildCollapseNode(collapseSummary))}>Insert collapse</button></div>
            <div><input aria-label="TOC title" value={tocTitle} maxLength={240} onChange={(event) => setTocTitle(event.target.value)} /><button type="button" onClick={() => insertAdvanced(buildTocNode(tocTitle))}>Insert automatic TOC</button></div>
            <div><select aria-label="Public content reference" value={referenceKey} disabled={!props.references.length} onChange={(event) => setReferenceKey(event.target.value)}>{props.references.map((reference) => <option value={`${reference.type}:${reference.slug}`} key={`${reference.type}:${reference.slug}`}>{reference.type} · {reference.title}</option>)}</select><button type="button" disabled={!referenceKey} onClick={() => { const reference = props.references.find((item) => `${item.type}:${item.slug}` === referenceKey); if (reference) insertAdvanced(buildContentReferenceNode(reference)) }}>Insert reference</button></div>
          </div>
        </aside>
        <aside className="editor-media-palette" aria-label="Media blocks">
          <header><div><span>Media blocks</span><small>正文只保存媒体 ID</small></div><a href="/studio#media-title">Manage library</a></header>
          {props.media.length ? <>
            <div className="editor-media-options"><label><span>Image size</span><select value={mediaSize} onChange={(event) => setMediaSize(event.target.value as typeof mediaSize)}><option value="compact">Compact</option><option value="content">Content</option><option value="wide">Wide</option></select></label><label><span>Caption / description</span><input value={mediaCaption} onChange={(event) => setMediaCaption(event.target.value)} maxLength={2_000} placeholder="可选公开说明" /></label></div>
            <div className="editor-media-list">{props.media.map((media) => <article key={media.id}>
              {media.kind === 'image' ? <Image src={`/media/${media.id}/thumb.webp`} alt={media.altText} width={320} height={213} unoptimized /> : <span className={`editor-media-kind ${media.kind}`}>{media.kind === 'audio' ? 'AUDIO' : media.kind === 'video' ? 'VIDEO' : 'FILE'}</span>}
              <div><strong>{media.originalName}</strong><small>{media.altText || 'No alt text'}</small></div>
              <button type="button" onClick={() => media.kind === 'image' ? insertImage(media) : insertNonImage(media)}>Insert {media.kind}</button>
              {media.kind === 'image' ? <label><input type="checkbox" checked={galleryIds.includes(media.id)} disabled={!galleryIds.includes(media.id) && galleryIds.length >= 3} onChange={(event) => setGalleryIds((current) => event.target.checked ? [...current, media.id] : current.filter((id) => id !== media.id))} />Gallery</label> : null}
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
      <ContentVersionHistory entryId={props.entryId} draftRevision={autosave.revision} versions={props.versions} />
    </section>
  )
}
