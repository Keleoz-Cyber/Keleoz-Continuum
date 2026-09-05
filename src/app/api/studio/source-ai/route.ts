import { z } from 'zod'
import { db } from '@/db/client'
import { getCurrentOwner } from '@/modules/auth/dal'
import { createAiQuotaRepository } from '@/modules/ai/repository'
import { getSharedAiConcurrencyGate } from '@/modules/ai/quota'
import { serverEnv as env } from '@/shared/env'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { relaySourceResponse } from '@/modules/ai/source-relay'
import { nativeThinkingMessages } from '@/modules/ai/native-thinking'
import { ownerDailyAiSession } from '@/modules/ai/daily-session'

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
  const dailySession = ownerDailyAiSession(owner.id,new Date())
  try {
    reservation = await quota.reserve({ feature: 'chat', sourceHash: owner.id, sessionId: dailySession, provider: 'openai-compatible', model: env.AI_MODEL!, inputCharacters: raw.length, now: new Date(), policy: { enabled: true, maxRequestsPerSourceDay: env.AI_CHAT_MAX_REQUESTS_PER_OWNER_DAY, maxRequestsPerSession: env.AI_CHAT_MAX_REQUESTS_PER_OWNER_DAY, cooldownSeconds: 0, dailyBudgetMicroUsd: env.AI_DAILY_BUDGET_MICRO_USD, inputMicroUsdPerMillionTokens: env.AI_INPUT_MICRO_USD_PER_MILLION_TOKENS, outputMicroUsdPerMillionTokens: env.AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS, maxOutputTokens: env.AI_CHAT_MAX_OUTPUT_TOKENS } })
  } catch { release(); return Response.json({ error: { message: '已达到站点 AI 额度。' } }, { status: 429 }) }
  try {
    const abort=new AbortController(),signal=AbortSignal.any([request.signal,abort.signal,AbortSignal.timeout(env.AI_TIMEOUT_MS)])
    const messages=new URL(env.AI_BASE_URL!).hostname==='api.deepseek.com'?nativeThinkingMessages(parsed.data.messages):parsed.data.messages
    const upstream = await fetch(`${env.AI_BASE_URL!.replace(/\/+$/, '')}/chat/completions`, { method: 'POST', headers: { authorization: `Bearer ${env.AI_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: env.AI_MODEL, messages, stream: parsed.data.stream, ...(parsed.data.stream ? { stream_options: { include_usage: true } } : {}), max_tokens: env.AI_CHAT_MAX_OUTPUT_TOKENS }), signal })
    if (!upstream.ok || !upstream.body) throw new Error('upstream failed')
    const body=relaySourceResponse(upstream,{stream:parsed.data.stream,signal,abort:()=>abort.abort(),release,finish:async result=>{
      await quota.complete({id:reservation.id,outputCharacters:result.outputCharacters,promptTokens:result.promptTokens,completionTokens:result.completionTokens,providerRequestId:result.providerRequestId,completedAt:new Date()})
      if(result.status==='failed')await quota.fail({id:reservation.id,errorCode:result.errorCode!,completedAt:new Date()})
    }})
    return new Response(body, { headers: { 'content-type': parsed.data.stream ? 'text/event-stream' : 'application/json', 'cache-control': 'private, no-store' } })
  } catch {
    await quota.fail({ id: reservation.id, errorCode: 'source_chat_failed', completedAt: new Date() })
    release()
    return Response.json({ error: { message: 'AI 暂时无法回复，请重试。' } }, { status: 502 })
  }
}
