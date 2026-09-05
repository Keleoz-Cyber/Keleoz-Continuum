import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getCurrentOwner } from '@/modules/auth/dal'
import { contentRepository } from '@/modules/content/runtime'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { serverEnv } from '@/shared/env'
import { tiptapDocumentSchema } from '@/modules/content/schemas'

const postSchema = z.object({
  id: z.string().max(180), title: z.string().max(240), subtitle: z.string().max(320).default(''),
  content: z.string().max(500_000), category: z.string().max(120).default(''),
  format: z.enum(['md', 'txt']).default('txt'), revision: z.number().int().positive().optional(),
  created: z.number().finite().optional(), locked: z.boolean().default(false),
})

export async function GET() {
  if (!await getCurrentOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const entries = await contentRepository.listStudioContent({ type: 'blog' })
  const posts = await Promise.all(entries.filter((entry) => entry.status !== 'archived').map(async (entry) => {
    const draft = await contentRepository.getDraftById(entry.id)
    const document = draft ? tiptapDocumentSchema.parse(draft.document) : null
    const attrs = document?.attrs
    return { id: entry.id, title: entry.title, subtitle: entry.subtitle ?? '', category: entry.categoryLabel ?? '', content: typeof attrs?.sourceText === 'string' ? attrs.sourceText : '', format: attrs?.sourceFormat ?? 'txt', locked: Boolean(attrs?.sourceLocked), revision: entry.revision, richDocument: !attrs?.sourceFormat && Boolean(document?.content?.some((node) => node.type !== 'paragraph' || node.content?.length)), created: Number(attrs?.sourceCreated) || entry.updatedAt.getTime(), updated: entry.updatedAt.getTime() }
  }))
  return Response.json(posts, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  if (!await getCurrentOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  if (!hasAllowedOrigin(request, serverEnv.SITE_ORIGIN)) return Response.json({ error: 'invalid_origin' }, { status: 403 })
  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'invalid_post' }, { status: 400 })
  const p = parsed.data
  const existing = z.uuid().safeParse(p.id).success ? await contentRepository.getDraftById(p.id) : null
  if (z.uuid().safeParse(p.id).success && !existing) return Response.json({ error: 'not_found' }, { status: 404 })
  if (existing && existing.type !== 'blog') return Response.json({ error: 'wrong_content_type' }, { status: 400 })
  if (existing && p.revision !== existing.revision) return Response.json({ error: 'draft_conflict' }, { status: 409 })
  const snapshot = { title: p.title.trim() || '未命名日志', subtitle: p.subtitle || null, categoryLabel: p.category || null, summary: existing?.summary ?? '', exposure: existing?.exposure ?? 'hidden' as const, document: { type: 'doc' as const, attrs: { sourceText: p.content, sourceFormat: p.format, sourceLocked: p.locked, sourceCreated: p.created ?? Date.now() }, content: p.content.split(/\n\n+/).map((text) => ({ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) })) } }
  const saved = existing
    ? await contentRepository.saveDraft({ entryId: existing.id, expectedRevision: existing.revision, snapshot })
    : await contentRepository.createDraft({ ...snapshot, type: 'blog', slug: `writing-${randomUUID().slice(0, 8)}` })
  return Response.json({ ...p, created: p.created ?? Date.now(), updated: Date.now(), id: existing?.id ?? ('id' in saved ? saved.id : p.id), revision: saved.revision }, { headers: { 'Cache-Control': 'private, no-store' } })
}
