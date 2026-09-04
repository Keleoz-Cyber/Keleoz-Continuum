import { z } from 'zod'

import { AiQuotaError } from '@/modules/ai/repository'
import { hasAllowedOrigin } from '@/shared/same-origin'

const requestSchema = z.object({
  threadId: z.uuid(),
  content: z.string().trim().min(1).max(12_000),
})

export function createOwnerChatHttpHandler(dependencies: {
  siteOrigin: string
  getOwner(): Promise<{ id: string; username: string } | null>
  send(input: { ownerId: string; threadId: string; content: string; now: Date }): Promise<unknown>
  now?: () => Date
}) {
  return async function POST(request: Request) {
    const owner = await dependencies.getOwner()
    if (!owner) return Response.json({ code: 'unauthorized' }, { status: 401 })
    if (!hasAllowedOrigin(request, dependencies.siteOrigin)) return Response.json({ code: 'invalid_origin' }, { status: 403 })
    let body: unknown
    try { body = await request.json() } catch { return Response.json({ code: 'invalid_json' }, { status: 400 }) }
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) return Response.json({ code: 'invalid_request' }, { status: 400 })
    try {
      const result = await dependencies.send({
        ownerId: owner.id,
        threadId: parsed.data.threadId,
        content: parsed.data.content,
        now: dependencies.now?.() ?? new Date(),
      })
      return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
      if (error instanceof AiQuotaError) {
        return Response.json({ code: error.reason }, { status: error.reason === 'disabled' ? 503 : 429 })
      }
      const message = error instanceof Error ? error.message : ''
      if (message.includes('not found')) return Response.json({ code: 'not_found' }, { status: 404 })
      if (message.includes('archived') || message.includes('disabled')) return Response.json({ code: 'unavailable' }, { status: 409 })
      return Response.json({ code: 'chat_failed' }, { status: 502 })
    }
  }
}
