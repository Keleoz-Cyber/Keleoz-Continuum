import { z } from 'zod'

import type { TiptapDocument, TiptapNode } from '@/modules/content/schemas'

const text = z.string().trim().max(2_000).default('')
export const continuumImageAttrsSchema = z.object({
  mediaId: z.uuid(),
  alt: text,
  caption: text,
  size: z.enum(['compact', 'content', 'wide']).default('content'),
}).strict()

export const continuumGalleryItemSchema = z.object({
  mediaId: z.uuid(),
  alt: text,
  caption: text,
}).strict()

export const continuumGalleryAttrsSchema = z.object({
  items: z.array(continuumGalleryItemSchema).min(2).max(3),
}).strict()

export type ContinuumImageAttrs = z.infer<typeof continuumImageAttrsSchema>
export type ContinuumGalleryItem = z.infer<typeof continuumGalleryItemSchema>

export function extractMediaReferences(document: TiptapDocument) {
  const references: Array<{ mediaId: string; alt: string; caption: string }> = []
  function visit(node: TiptapNode) {
    if (node.type === 'continuumImage') {
      const parsed = continuumImageAttrsSchema.safeParse(node.attrs)
      if (!parsed.success) throw new Error(`Invalid media image block: ${parsed.error.message}`)
      references.push(parsed.data)
    }
    if (node.type === 'continuumGallery') {
      const parsed = continuumGalleryAttrsSchema.safeParse(node.attrs)
      if (!parsed.success) throw new Error(`Invalid media gallery block: ${parsed.error.message}`)
      references.push(...parsed.data.items)
    }
    for (const child of node.content ?? []) visit(child)
  }
  visit(document)
  return references
}

export function mediaNodeText(node: TiptapNode) {
  if (node.type === 'continuumImage') {
    const attrs = continuumImageAttrsSchema.parse(node.attrs)
    return attrs.caption || attrs.alt
  }
  if (node.type === 'continuumGallery') {
    const attrs = continuumGalleryAttrsSchema.parse(node.attrs)
    return attrs.items.map((item) => item.caption || item.alt).filter(Boolean).join('\n')
  }
  return null
}
