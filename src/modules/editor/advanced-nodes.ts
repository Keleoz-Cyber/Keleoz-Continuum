import {
  continuumCalloutAttrsSchema,
  continuumCollapseAttrsSchema,
  continuumReferenceAttrsSchema,
  continuumTocAttrsSchema,
} from '@/modules/content/advanced-nodes'
import type { PublicContentListItem } from '@/modules/content/dto'
import type { TiptapNode } from '@/modules/content/schemas'

export type EditorContentReference = Pick<PublicContentListItem, 'type' | 'slug' | 'title' | 'summary'>

export function buildCalloutNode(tone: 'note' | 'tip' | 'warning', title: string): TiptapNode {
  return { type: 'continuumCallout', attrs: continuumCalloutAttrsSchema.parse({ tone, title }), content: [{ type: 'paragraph' }] }
}
export function buildCollapseNode(summary: string): TiptapNode {
  return { type: 'continuumCollapse', attrs: continuumCollapseAttrsSchema.parse({ summary, open: false }), content: [{ type: 'paragraph' }] }
}
export function buildTocNode(title: string): TiptapNode {
  return { type: 'continuumToc', attrs: continuumTocAttrsSchema.parse({ title, entries: [] }) }
}
export function buildContentReferenceNode(reference: EditorContentReference): TiptapNode {
  return {
    type: 'continuumReference',
    attrs: continuumReferenceAttrsSchema.parse({
      contentType: reference.type, slug: reference.slug, title: reference.title, summary: reference.summary,
    }),
  }
}
