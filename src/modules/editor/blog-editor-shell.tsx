'use client'

import dynamic from 'next/dynamic'

import type { DraftSnapshot } from '@/modules/content/schemas'
import type { EditorMediaItem } from '@/modules/editor/media-nodes'
import type { EditorContentReference } from '@/modules/editor/advanced-nodes'
import type { EditorContentVersion } from '@/modules/editor/content-version-history'

const BlogEditorClient = dynamic(
  () => import('@/modules/editor/blog-editor-client').then((module) => module.BlogEditorClient),
  { ssr: false, loading: () => <p className="editor-loading">Preparing the writing space…</p> },
)

export function BlogEditorShell(props: {
  entryId: string
  slug: string
  revision: number
  initialSnapshot: DraftSnapshot
  media: EditorMediaItem[]
  references: EditorContentReference[]
  versions: EditorContentVersion[]
}) {
  return <BlogEditorClient {...props} />
}
