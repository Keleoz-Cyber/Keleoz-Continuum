import { z } from 'zod'
import type { TiptapDocument } from '@/modules/content/schemas'

export const sourcePostSchema = z.object({
  id: z.string().max(180), title: z.string().max(240), subtitle: z.string().max(320).default(''),
  content: z.string().max(500_000), category: z.string().max(120).default(''),
  format: z.enum(['md', 'txt']).default('txt'), revision: z.number().int().positive().optional(),
  created: z.number().finite().optional(), locked: z.boolean().default(false),
  type: z.enum(['blog', 'project', 'moment', 'page']).default('blog'),
})

export function isSourceEditable(document: TiptapDocument) {
  return (document.content ?? []).every(node => node.type === 'paragraph' &&
    !node.marks?.length && (node.content ?? []).every(child =>
      (child.type === 'text' || child.type === 'hardBreak') && !child.marks?.length && !child.content?.length))
}

export function sourceDocumentText(document: TiptapDocument) {
  if (!isSourceEditable(document)) throw new Error('rich_document_requires_block_editor')
  if (typeof document.attrs?.sourceText === 'string' && ['md', 'txt'].includes(String(document.attrs.sourceFormat))) return document.attrs.sourceText
  return (document.content ?? []).map(node => (node.content ?? []).map(child => child.type === 'hardBreak' ? '\n' : child.text ?? '').join('')).join('\n\n')
}
