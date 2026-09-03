import { z } from 'zod'

import type { TiptapDocument, TiptapNode } from '@/modules/content/schemas'

const shortText = z.string().trim().min(1).max(240)
export const continuumCalloutAttrsSchema = z.object({
  tone: z.enum(['note', 'tip', 'warning']).default('note'),
  title: shortText,
}).strict()
export const continuumCollapseAttrsSchema = z.object({
  summary: shortText,
  open: z.boolean().default(false),
}).strict()
export const continuumReferenceAttrsSchema = z.object({
  contentType: z.enum(['blog', 'project', 'moment', 'page']),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,159}$/),
  title: shortText,
  summary: z.string().trim().max(2_000).default(''),
}).strict()
const tocEntrySchema = z.object({ id: z.string(), title: z.string(), level: z.number().int().min(1).max(6) })
const blockIdPattern = /^[a-z0-9][a-z0-9_-]*$/
export const continuumTocAttrsSchema = z.object({
  title: shortText.default('On this page'),
  entries: z.array(tocEntrySchema).default([]),
}).strict()

function textOf(node: TiptapNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(textOf).join('')
}

function headingBase(value: string, index: number) {
  const ascii = value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return ascii || `section-${index}`
}

export function prepareAdvancedDocument(document: TiptapDocument): TiptapDocument {
  const seenBlockIds = new Set<string>()
  const entries: Array<{ id: string; title: string; level: number }> = []
  let headingIndex = 0
  function normalize(node: TiptapNode): TiptapNode {
    let attrs = node.attrs ? { ...node.attrs } : undefined
    if (node.type === 'heading') {
      headingIndex += 1
      const title = textOf(node).trim() || `Section ${headingIndex}`
      const requested = typeof attrs?.blockId === 'string' && blockIdPattern.test(attrs.blockId)
        ? attrs.blockId
        : headingBase(title, headingIndex)
      let id = requested
      let suffix = 1
      while (seenBlockIds.has(id)) {
        suffix += 1
        id = `${requested}-${suffix}`
      }
      seenBlockIds.add(id)
      attrs = { ...attrs, blockId: id }
      const level = typeof attrs.level === 'number' ? attrs.level : 2
      if (level >= 2 && level <= 3) entries.push({ id, title, level })
    } else if (typeof attrs?.blockId === 'string') {
      if (!blockIdPattern.test(attrs.blockId) || seenBlockIds.has(attrs.blockId)) {
        attrs = { ...attrs, blockId: null }
      } else {
        seenBlockIds.add(attrs.blockId)
      }
    }
    if (node.type === 'continuumCallout') {
      const parsed = continuumCalloutAttrsSchema.safeParse(attrs)
      if (!parsed.success) throw new Error(`Invalid callout block: ${parsed.error.message}`)
    }
    if (node.type === 'continuumCollapse') {
      const parsed = continuumCollapseAttrsSchema.safeParse(attrs)
      if (!parsed.success) throw new Error(`Invalid collapse block: ${parsed.error.message}`)
    }
    if (node.type === 'continuumReference') {
      const parsed = continuumReferenceAttrsSchema.safeParse(attrs)
      if (!parsed.success) throw new Error(`Invalid reference block: ${parsed.error.message}`)
    }
    return { ...node, attrs, content: node.content?.map(normalize) }
  }
  const normalized = normalize(document) as TiptapDocument
  function fillToc(node: TiptapNode): TiptapNode {
    const attrs = node.type === 'continuumToc'
      ? continuumTocAttrsSchema.parse({ ...node.attrs, entries })
      : node.attrs
    return { ...node, attrs, content: node.content?.map(fillToc) }
  }
  return fillToc(normalized) as TiptapDocument
}

export function advancedNodeText(node: TiptapNode): string | null {
  if (node.type === 'continuumCallout') return continuumCalloutAttrsSchema.parse(node.attrs).title
  if (node.type === 'continuumCollapse') return continuumCollapseAttrsSchema.parse(node.attrs).summary
  if (node.type === 'continuumReference') {
    const attrs = continuumReferenceAttrsSchema.parse(node.attrs)
    return [attrs.title, attrs.summary].filter(Boolean).join('\n')
  }
  if (node.type === 'continuumToc') return ''
  return null
}

export function publicReferencePath(type: z.infer<typeof continuumReferenceAttrsSchema>['contentType'], slug: string) {
  if (type === 'blog') return `/blog/${slug}`
  if (type === 'project') return `/projects/${slug}`
  if (type === 'moment') return `/moments/${slug}`
  return slug === 'about' ? '/about' : `/pages/${slug}`
}
