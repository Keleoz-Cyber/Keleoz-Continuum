import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getCurrentOwner } from '@/modules/auth/dal'
import { contentRepository } from '@/modules/content/runtime'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { serverEnv } from '@/shared/env'
import { tiptapDocumentSchema } from '@/modules/content/schemas'
import { isSourceEditable, sourceDocumentText, sourcePostSchema } from '@/modules/source-native/posts'
import { DraftConflictError } from '@/modules/content/repository'

export async function GET(request: Request) {
  if (!await getCurrentOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const type = z.enum(['blog', 'project', 'moment', 'page']).catch('blog').parse(new URL(request.url).searchParams.get('type'))
  const entries = await contentRepository.listStudioContent({ type })
  const posts = await Promise.all(entries.filter((entry) => entry.status !== 'archived').map(async (entry) => {
    const draft = await contentRepository.getDraftById(entry.id)
    const document = draft ? tiptapDocumentSchema.parse(draft.document) : null
    const attrs = document?.attrs
    const editable = document && isSourceEditable(document)
    return { id: entry.id, type: entry.type, title: entry.title, subtitle: entry.subtitle ?? '', category: entry.categoryLabel ?? '', content: editable ? sourceDocumentText(document) : '', format: attrs?.sourceFormat ?? 'txt', locked: Boolean(attrs?.sourceLocked), revision: entry.revision, richDocument: !editable, created: Number(attrs?.sourceCreated) || entry.updatedAt.getTime(), updated: entry.updatedAt.getTime() }
  }))
  return Response.json(posts, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  if (!await getCurrentOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  if (!hasAllowedOrigin(request, serverEnv.SITE_ORIGIN)) return Response.json({ error: 'invalid_origin' }, { status: 403 })
  const parsed = sourcePostSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'invalid_post' }, { status: 400 })
  const p = parsed.data
  const existing = z.uuid().safeParse(p.id).success ? await contentRepository.getDraftById(p.id) : null
  if (z.uuid().safeParse(p.id).success && !existing) return Response.json({ error: 'not_found' }, { status: 404 })
  if (existing && existing.type !== p.type) return Response.json({ error: 'wrong_content_type' }, { status: 400 })
  if (existing && !isSourceEditable(tiptapDocumentSchema.parse(existing.document))) return Response.json({ error: 'rich_document_requires_block_editor' }, { status: 409 })
  if (existing && p.revision !== existing.revision) return Response.json({ error: 'draft_conflict' }, { status: 409 })
  const snapshot = { title: p.title.trim() || '未命名日志', subtitle: p.subtitle || null, categoryLabel: p.category || null, summary: existing?.summary ?? '', exposure: existing?.exposure ?? 'hidden' as const, document: { type: 'doc' as const, attrs: { sourceText: p.content, sourceFormat: p.format, sourceLocked: p.locked, sourceCreated: p.created ?? Date.now() }, content: p.content.split(/\n\n+/).map((text) => ({ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) })) } }
  try {
    const saved = existing
      ? await contentRepository.saveDraft({ entryId: existing.id, expectedRevision: existing.revision, snapshot })
      : await contentRepository.createDraft({ ...snapshot, type: p.type, slug: `${p.type}-${randomUUID().slice(0, 8)}` })
    return Response.json({ ...p, created: p.created ?? Date.now(), updated: Date.now(), id: existing?.id ?? ('id' in saved ? saved.id : p.id), revision: saved.revision }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof DraftConflictError) return Response.json({ error: 'draft_conflict' }, { status: 409 })
    throw error
  }
}
