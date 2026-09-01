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

export const continuumAudioAttrsSchema = z.object({
  mediaId: z.uuid(), title: z.string().trim().max(240).default(''), caption: text,
}).strict()
export const continuumVideoAttrsSchema = z.object({
  mediaId: z.uuid(), title: z.string().trim().max(240).default(''), caption: text,
}).strict()
export const continuumAttachmentAttrsSchema = z.object({
  mediaId: z.uuid(), label: z.string().trim().min(1).max(240), description: text,
}).strict()

export type ContinuumImageAttrs = z.infer<typeof continuumImageAttrsSchema>
export type ContinuumGalleryItem = z.infer<typeof continuumGalleryItemSchema>

export function extractMediaReferences(document: TiptapDocument) {
  const references: Array<{
    mediaId: string
    alt: string
    caption: string
    kind: 'image' | 'audio' | 'video' | 'attachment'
  }> = []
  function visit(node: TiptapNode) {
    if (node.type === 'continuumImage') {
      const parsed = continuumImageAttrsSchema.safeParse(node.attrs)
      if (!parsed.success) throw new Error(`Invalid media image block: ${parsed.error.message}`)
      references.push({ ...parsed.data, kind: 'image' })
    }
    if (node.type === 'continuumGallery') {
      const parsed = continuumGalleryAttrsSchema.safeParse(node.attrs)
      if (!parsed.success) throw new Error(`Invalid media gallery block: ${parsed.error.message}`)
      references.push(...parsed.data.items.map((item) => ({ ...item, kind: 'image' as const })))
    }
    if (node.type === 'continuumAudio' || node.type === 'continuumVideo') {
      const schema = node.type === 'continuumAudio' ? continuumAudioAttrsSchema : continuumVideoAttrsSchema
      const parsed = schema.safeParse(node.attrs)
      if (!parsed.success) throw new Error(`Invalid media ${node.type === 'continuumAudio' ? 'audio' : 'video'} block: ${parsed.error.message}`)
      references.push({
        mediaId: parsed.data.mediaId,
        alt: parsed.data.title,
        caption: parsed.data.caption,
        kind: node.type === 'continuumAudio' ? 'audio' : 'video',
      })
    }
    if (node.type === 'continuumAttachment') {
      const parsed = continuumAttachmentAttrsSchema.safeParse(node.attrs)
      if (!parsed.success) throw new Error(`Invalid media attachment block: ${parsed.error.message}`)
      references.push({ mediaId: parsed.data.mediaId, alt: parsed.data.label, caption: parsed.data.description, kind: 'attachment' })
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
  if (node.type === 'continuumAudio') {
    const attrs = continuumAudioAttrsSchema.parse(node.attrs)
    return attrs.caption || attrs.title
  }
  if (node.type === 'continuumVideo') {
    const attrs = continuumVideoAttrsSchema.parse(node.attrs)
    return attrs.caption || attrs.title
  }
  if (node.type === 'continuumAttachment') {
    const attrs = continuumAttachmentAttrsSchema.parse(node.attrs)
    return [attrs.label, attrs.description].filter(Boolean).join('\n')
  }
  return null
}
