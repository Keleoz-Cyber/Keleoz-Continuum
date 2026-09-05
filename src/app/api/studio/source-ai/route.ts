import { z } from 'zod'
import { createHash } from 'node:crypto'
import { db } from '@/db/client'
import { getCurrentOwner } from '@/modules/auth/dal'
import { createAiQuotaRepository } from '@/modules/ai/repository'
import { getSharedAiConcurrencyGate } from '@/modules/ai/quota'
import { serverEnv as env } from '@/shared/env'
import { hasAllowedOrigin } from '@/shared/same-origin'

const image = z.object({ type: z.literal('image_url'), image_url: z.object({ url: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(8_000_000) }) })
const message = z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.union([z.string().max(500_000), z.array(z.union([z.object({ type: z.literal('text'), text: z.string().max(500_000) }), image])).max(12)]) })
const schema = z.object({ messages: z.array(message).min(1).max(160), stream: z.boolean().default(false) })
const quota = createAiQuotaRepository(db)
const holder = globalThis as typeof globalThis & { continuumAiGate?: ReturnType<typeof getSharedAiConcurrencyGate> }

export async function POST(request: Request) {
  const owner = await getCurrentOwner()
  if (!owner) return Response.json({ error: { message: '请先登录。' } }, { status: 401 })
  if (!hasAllowedOrigin(request, env.SITE_ORIGIN)) return Response.json({ error: { message: '请求来源不匹配。' } }, { status: 403 })
  if (!env.AI_GATEWAY_ENABLED) return Response.json({ error: { message: '站点 AI 尚未配置。' } }, { status: 503 })
  const raw = await request.text()
  if (raw.length > 12_000_000) return Response.json({ error: { message: '附件或上下文过大。' } }, { status: 413 })
  let data: unknown
  try { data = JSON.parse(raw) } catch { return Response.json({ error: { message: '请求格式错误。' } }, { status: 400 }) }
  const parsed = schema.safeParse(data)
  if (!parsed.success) return Response.json({ error: { message: '消息格式不受支持。' } }, { status: 400 })
  const release = getSharedAiConcurrencyGate(holder, env.AI_GLOBAL_MAX_CONCURRENCY).tryAcquire()
  if (!release) return Response.json({ error: { message: 'AI 正忙，请稍后再试。' } }, { status: 429 })
  let reservation: { id: string }
  const digest = createHash('sha256').update(`${owner.id}:${new Date().toISOString().slice(0, 10)}`).digest('hex')
  const dailySession = `${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`
  try {
    reservation = await quota.reserve({ feature: 'chat', sourceHash: owner.id, sessionId: dailySession, provider: 'openai-compatible', model: env.AI_MODEL!, inputCharacters: raw.length, now: new Date(), policy: { enabled: true, maxRequestsPerSourceDay: env.AI_CHAT_MAX_REQUESTS_PER_OWNER_DAY, maxRequestsPerSession: env.AI_CHAT_MAX_REQUESTS_PER_OWNER_DAY, cooldownSeconds: 0, dailyBudgetMicroUsd: env.AI_DAILY_BUDGET_MICRO_USD, inputMicroUsdPerMillionTokens: env.AI_INPUT_MICRO_USD_PER_MILLION_TOKENS, outputMicroUsdPerMillionTokens: env.AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS, maxOutputTokens: env.AI_CHAT_MAX_OUTPUT_TOKENS } })
  } catch { release(); return Response.json({ error: { message: '已达到站点 AI 额度。' } }, { status: 429 }) }
  try {
    const upstream = await fetch(`${env.AI_BASE_URL!.replace(/\/+$/, '')}/chat/completions`, { method: 'POST', headers: { authorization: `Bearer ${env.AI_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: env.AI_MODEL, messages: parsed.data.messages, stream: parsed.data.stream, ...(parsed.data.stream ? { stream_options: { include_usage: true } } : {}), max_tokens: env.AI_CHAT_MAX_OUTPUT_TOKENS }), signal: AbortSignal.any([request.signal, AbortSignal.timeout(env.AI_TIMEOUT_MS)]) })
    if (!upstream.ok || !upstream.body) throw new Error('upstream failed')
    const reader = upstream.body.getReader()
    let promptTokens = 0, completionTokens = 0, outputCharacters = 0, requestId = '', buffer = ''
    const decoder = new TextDecoder()
    const collect = (line: string) => {
      try {
        const item = JSON.parse(line.replace(/^data:\s*/, ''))
        if (item.id) requestId = String(item.id)
        if (item.usage) { promptTokens = Number(item.usage.prompt_tokens) || 0; completionTokens = Number(item.usage.completion_tokens) || 0 }
        outputCharacters += String(item.choices?.[0]?.delta?.content ?? item.choices?.[0]?.message?.content ?? '').length
      } catch { /* SSE comments and DONE carry no usage. */ }
    }
    const body = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const chunk = await reader.read()
            if (chunk.done) break
            controller.enqueue(chunk.value)
            buffer += decoder.decode(chunk.value, { stream: true })
            if (parsed.data.stream) { const lines = buffer.split('\n'); buffer = lines.pop() ?? ''; lines.forEach(collect) }
          }
          if (buffer) collect(buffer)
          await quota.complete({ id: reservation.id, outputCharacters, promptTokens, completionTokens, providerRequestId: requestId, completedAt: new Date() })
          controller.close()
        } catch (error) {
          await quota.fail({ id: reservation.id, errorCode: 'source_chat_failed', completedAt: new Date() })
          controller.error(error)
        } finally { release() }
      },
      async cancel() { await reader.cancel(); release() },
    })
    return new Response(body, { headers: { 'content-type': parsed.data.stream ? 'text/event-stream' : 'application/json', 'cache-control': 'private, no-store' } })
  } catch {
    await quota.fail({ id: reservation.id, errorCode: 'source_chat_failed', completedAt: new Date() })
    release()
    return Response.json({ error: { message: 'AI 暂时无法回复，请重试。' } }, { status: 502 })
  }
}
