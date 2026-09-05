'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useEditor } from '@tiptap/react'
import { generateJSON, type Editor } from '@tiptap/core'

import { getContinuumExtensions } from '@/modules/content/extensions'
import type { DraftSnapshot, TiptapDocument, TiptapNode } from '@/modules/content/schemas'
import {
  canApplyEditorLink,
  editorTextSelectionRange,
  normalizeEditorLink,
  type EditorTextSelectionRange,
} from '@/modules/editor/formatting'
import { useDraftAutosave } from '@/modules/editor/use-draft-autosave'
import { moveTopLevelDocumentBlock, topLevelBlockIndexAtPosition } from '@/modules/editor/block-order'
import { type EditorContentVersion } from '@/modules/editor/content-version-history'
import { OriginalEditorFrame } from './original-editor-frame'
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
  return <button type="button" className="btn" onMouseDown={event=>event.preventDefault()} aria-pressed={props.active} disabled={props.disabled} onClick={props.onClick}>{props.label}</button>
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
  sourceConversion?: { html: string; attachments: TiptapNode[] }
  categories?: string[]
}) {
  const [title, setTitle] = useState(props.initialSnapshot.title)
  const [subtitle, setSubtitle] = useState(props.initialSnapshot.subtitle ?? '')
  const [categoryLabel, setCategoryLabel] = useState(props.initialSnapshot.categoryLabel ?? '')
  const summary = props.initialSnapshot.summary
  const exposure = props.initialSnapshot.exposure
  const [mediaItems,setMediaItems]=useState(props.media)
  const [notice,setNotice]=useState('')
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
  const initialContent = useMemo(() => props.sourceConversion ? {
    type:'doc',content:[...(generateJSON(props.sourceConversion.html,extensions).content??[]),...props.sourceConversion.attachments],
  } : props.initialSnapshot.document, [extensions,props.sourceConversion,props.initialSnapshot.document])
  const editor = useEditor({
    extensions,
    content: initialContent,
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
      const media = mediaItems.find((item) => item.id === id)
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
  const blockCount = editor?.state.doc.childCount ?? 0
  const editorText = editor?.getText() ?? ''
  const editorStats = {
    characters: editorText.length,
    lines: editorText ? editorText.split('\n').length : 0,
    kilobytes: new TextEncoder().encode(editorText).length / 1_024,
  }
  const moveSelectedBlock = (direction: -1 | 1) => {
    if (!editor || selectedBlockIndex === null) return
    const current=editor.getJSON() as TiptapDocument
    const moved = moveTopLevelDocumentBlock(current, selectedBlockIndex, direction)
    if (moved === current) return
    editor.commands.setContent(moved, { emitUpdate: false })
    setDocument(moved)
    setSelectedBlockIndex(selectedBlockIndex + direction)
  }

  const saveAndGo=async(destination:string)=>{try{await autosave.flush();window.location.href=destination}catch{setNotice('保存失败或版本冲突，当前内容仍保留。请重试；冲突时请先备份当前内容再重新打开。')}}
  const importText=async(file:File)=>{
    try{
      if(file.size>500_000||! /\.(txt|md|markdown)$/i.test(file.name))throw new Error('请选择不超过 500 KB 的文本或 Markdown 文件。')
      const response=await fetch('/api/studio/source-markdown',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:await file.text(),format:/\.(md|markdown)$/i.test(file.name)?'md':'txt'})})
      if(!response.ok)throw new Error('导入失败，原有内容没有改变。')
      const {html}=await response.json();editor?.chain().focus().insertContentAt(editor.state.doc.content.size,generateJSON(html,extensions).content??[]).run()
    }catch(error){setNotice(error instanceof Error?error.message:'导入失败')}
  }
  const sourceCommand=(command:string)=>{
    if(!editor)return
    const chain=editor.chain().focus()
    switch(command){
      case 'h1':chain.toggleHeading({level:2}).run();break
      case 'h2':chain.toggleHeading({level:3}).run();break
      case 'h3':chain.toggleHeading({level:4}).run();break
      case 'b':chain.toggleBold().run();break
      case 'i':chain.toggleItalic().run();break
      case 'code':chain.toggleCode().run();break
      case 'quote':chain.toggleBlockquote().run();break
      case 'ul':chain.toggleBulletList().run();break
      case 'ol':chain.toggleOrderedList().run();break
      case 'pre':chain.toggleCodeBlock().run();break
      case 'hr':chain.setHorizontalRule().run();break
      case 'link':setLinkSelection(editorTextSelectionRange(editor.state.selection));setLinkSelectionHasCode(editor.isActive('code'));setNotice('已保留文字选区，请展开“格式工具”填写链接。');break
    }
  }

  return (
    <OriginalEditorFrame editor={editor} title={title} subtitle={subtitle} category={categoryLabel} categories={props.categories??[]} onMetadata={(key,value)=>{if(key==='title')setTitle(value);else if(key==='subtitle')setSubtitle(value);else setCategoryLabel(value)}} onSave={saveAndGo} onImport={importText} onCommand={sourceCommand} entryId={props.entryId} characters={editorStats.characters} lines={editorStats.lines} size={editorStats.kilobytes} tools={<>
      <button className="btn" onClick={()=>void saveAndGo(`/studio/content/${props.entryId}/settings`)}>发布设置与版本</button>
      <button className="btn" onClick={()=>void saveAndGo(`/studio/content/${props.entryId}/preview`)}>保存并预览</button>
      {props.sourceConversion?<p>首次修改正文后转为块文档；仅查看不会改变原文。</p>:null}
      {notice?<p role="status">{notice}</p>:null}
        <details className="editor-format-toolbar" aria-label="Formatting tools"><summary>格式工具</summary>
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
        </details>
        <div className="editor-block-order-controls" aria-label="Block ordering">
          <span>{selectedBlockIndex === null ? 'Select a block' : `Block ${selectedBlockIndex + 1} of ${blockCount}`}</span>
          <button type="button" disabled={selectedBlockIndex === null || selectedBlockIndex === 0} onClick={() => moveSelectedBlock(-1)}>Move up</button>
          <button type="button" disabled={selectedBlockIndex === null || selectedBlockIndex >= blockCount - 1} onClick={() => moveSelectedBlock(1)}>Move down</button>
        </div>
        <details className="editor-advanced-palette source-rift-drawer">
          <summary>Advanced blocks · 提示、折叠、引用与自动目录</summary>
          <div className="editor-advanced-grid">
            <div><select aria-label="Callout tone" value={calloutTone} onChange={(event) => setCalloutTone(event.target.value as typeof calloutTone)}><option value="note">Note</option><option value="tip">Tip</option><option value="warning">Warning</option></select><input aria-label="Callout title" value={calloutTitle} maxLength={240} onChange={(event) => setCalloutTitle(event.target.value)} /><button type="button" onClick={() => insertAdvanced(buildCalloutNode(calloutTone, calloutTitle))}>Insert callout</button></div>
            <div><input aria-label="Collapse summary" value={collapseSummary} maxLength={240} onChange={(event) => setCollapseSummary(event.target.value)} /><button type="button" onClick={() => insertAdvanced(buildCollapseNode(collapseSummary))}>Insert collapse</button></div>
            <div><input aria-label="TOC title" value={tocTitle} maxLength={240} onChange={(event) => setTocTitle(event.target.value)} /><button type="button" onClick={() => insertAdvanced(buildTocNode(tocTitle))}>Insert automatic TOC</button></div>
            <div><select aria-label="Public content reference" value={referenceKey} disabled={!props.references.length} onChange={(event) => setReferenceKey(event.target.value)}>{props.references.map((reference) => <option value={`${reference.type}:${reference.slug}`} key={`${reference.type}:${reference.slug}`}>{reference.type} · {reference.title}</option>)}</select><button type="button" disabled={!referenceKey} onClick={() => { const reference = props.references.find((item) => `${item.type}:${item.slug}` === referenceKey); if (reference) insertAdvanced(buildContentReferenceNode(reference)) }}>Insert reference</button></div>
          </div>
        </details>
        <details className="editor-media-palette source-rift-drawer">
          <summary>Media blocks · 正文只保存媒体 ID</summary>
          <header><div><span>Media Library</span><small>图片、音频、视频与附件</small></div><a href="/studio?section=media" target="_blank" rel="noreferrer">Manage library</a></header>
          <button className="btn" onClick={async()=>{try{const response=await fetch('/api/studio/source-media');if(!response.ok)throw new Error();setMediaItems(await response.json())}catch{setNotice('媒体库刷新失败，请重试。')}}}>刷新媒体库</button>
          {mediaItems.length ? <>
            <div className="editor-media-options"><label><span>Image size</span><select value={mediaSize} onChange={(event) => setMediaSize(event.target.value as typeof mediaSize)}><option value="compact">Compact</option><option value="content">Content</option><option value="wide">Wide</option></select></label><label><span>Caption / description</span><input value={mediaCaption} onChange={(event) => setMediaCaption(event.target.value)} maxLength={2_000} placeholder="可选公开说明" /></label></div>
            <div className="editor-media-list">{mediaItems.map((media) => <article key={media.id}>
              {media.kind === 'image' ? <Image src={`/media/${media.id}/thumb.webp`} alt={media.altText} width={320} height={213} unoptimized /> : <span className={`editor-media-kind ${media.kind}`}>{media.kind === 'audio' ? 'AUDIO' : media.kind === 'video' ? 'VIDEO' : 'FILE'}</span>}
              <div><strong>{media.originalName}</strong><small>{media.altText || 'No alt text'}</small></div>
              <button type="button" onClick={() => media.kind === 'image' ? insertImage(media) : insertNonImage(media)}>Insert {media.kind}</button>
              {media.kind === 'image' ? <label><input type="checkbox" checked={galleryIds.includes(media.id)} disabled={!galleryIds.includes(media.id) && galleryIds.length >= 3} onChange={(event) => setGalleryIds((current) => event.target.checked ? [...current, media.id] : current.filter((id) => id !== media.id))} />Gallery</label> : null}
            </article>)}</div>
            <div className="editor-media-actions"><button type="button" disabled={galleryIds.length < 2} onClick={insertGallery}>Insert gallery ({galleryIds.length}/3)</button><button type="button" onClick={() => editor?.chain().focus().deleteSelection().run()}>Remove selected block</button></div>
          </> : <p>媒体库为空。先返回 Studio 上传图片。</p>}
        </details>
      <div className="editor-status" data-state={autosave.state}>
        <span>{{idle:'自动保存已开启',dirty:'等待保存',saving:'正在保存',saved:'已保存',conflict:'版本冲突，请先保留当前内容再重新打开',error:'保存失败'}[autosave.state]}</span>
        <span> · r{autosave.revision}</span>
        {autosave.state === 'error' || autosave.state === 'conflict' ? (
          <button onClick={autosave.retry} type="button">
            Retry
          </button>
        ) : null}
      </div>
      <label>导入文本 / Markdown<input type="file" accept=".txt,.md,.markdown" onChange={event=>{if(event.target.files?.[0])void importText(event.target.files[0]);event.target.value=''}}/></label>
    </>} />
  )
}
