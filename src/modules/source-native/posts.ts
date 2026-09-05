import { z } from 'zod'
import type { TiptapDocument } from '@/modules/content/schemas'
import { continuumImageAttrsSchema, continuumGalleryAttrsSchema, continuumAudioAttrsSchema, continuumVideoAttrsSchema, continuumAttachmentAttrsSchema } from '@/modules/content/media-nodes'

export const sourceAttachmentSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('continuumImage'),attrs:continuumImageAttrsSchema}),
  z.object({type:z.literal('continuumGallery'),attrs:continuumGalleryAttrsSchema}),
  z.object({type:z.literal('continuumAudio'),attrs:continuumAudioAttrsSchema}),
  z.object({type:z.literal('continuumVideo'),attrs:continuumVideoAttrsSchema}),
  z.object({type:z.literal('continuumAttachment'),attrs:continuumAttachmentAttrsSchema}),
])
export function sourceAttachments(document: TiptapDocument) {
  return (document.content ?? []).filter(node=>sourceAttachmentSchema.safeParse(node).success)
}

export const sourcePostSchema = z.object({
  id: z.string().max(180), title: z.string().max(240), subtitle: z.string().max(320).default(''),
  content: z.string().max(500_000), category: z.string().max(120).default(''),
  format: z.enum(['md', 'txt']).default('txt'), revision: z.number().int().positive().optional(),
  created: z.number().finite().optional(), locked: z.boolean().default(false),
  type: z.enum(['blog', 'project', 'moment', 'page']).default('blog'),
  attachments: z.array(sourceAttachmentSchema).max(32).optional(),
})

export function isSourceEditable(document: TiptapDocument) {
  let mediaStarted=false
  return (document.content ?? []).every(node => {
    if(document.attrs?.sourceMedia===true && typeof document.attrs.sourceText==='string' && sourceAttachmentSchema.safeParse(node).success){mediaStarted=true;return true}
    return !mediaStarted && node.type === 'paragraph' &&
    !node.marks?.length && (node.content ?? []).every(child =>
      (child.type === 'text' || child.type === 'hardBreak') && !child.marks?.length && !child.content?.length)
  })
}

export function sourceDocumentText(document: TiptapDocument) {
  if (!isSourceEditable(document)) throw new Error('rich_document_requires_block_editor')
  if (typeof document.attrs?.sourceText === 'string' && ['md', 'txt'].includes(String(document.attrs.sourceFormat))) return document.attrs.sourceText
  return (document.content ?? []).map(node => (node.content ?? []).map(child => child.type === 'hardBreak' ? '\n' : child.text ?? '').join('')).join('\n\n')
}
