export type TiptapMark = {
  type: string
  attrs?: Record<string, unknown>
}

export type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
}

export type TiptapDocument = TiptapNode & {
  type: 'doc'
}

export type DraftSnapshot = {
  title: string
  subtitle: string | null
  categoryLabel: string | null
  summary: string
  exposure: 'full' | 'summary' | 'hidden'
  document: TiptapDocument
}

const markSchema: z.ZodType<TiptapMark> = z.object({
  type: z.string().min(1),
  attrs: z.record(z.string(), z.unknown()).optional(),
})

const nodeSchema: z.ZodType<TiptapNode> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(nodeSchema).optional(),
    marks: z.array(markSchema).optional(),
    text: z.string().optional(),
  }),
)

export const tiptapDocumentSchema: z.ZodType<TiptapDocument> = z.object({
  type: z.literal('doc'),
  attrs: z.record(z.string(), z.unknown()).optional(),
  content: z.array(nodeSchema).optional(),
})
import { z } from 'zod'
