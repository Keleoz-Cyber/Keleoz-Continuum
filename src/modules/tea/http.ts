import { createHmac } from 'node:crypto'

import { AiProviderError } from '@/modules/ai/provider'
import { AiQuotaError } from '@/modules/ai/repository'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { teaGatewayRequestSchema, type TeaGatewayRequest } from '@/modules/tea/contracts'
import { AiBusyError, AiUnavailableError } from '@/modules/tea/service'

type Dependencies = {
  siteOrigin: string
  fingerprintSecret: string
  getClientAddress(request: Request): Promise<string>
  service: {
    complete(input: { request: TeaGatewayRequest; sourceHash: string; now: Date;signal?:AbortSignal }): Promise<{ content: string }>
  }
}

function json(body: unknown, status: number, extraHeaders?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...extraHeaders },
  })
}

function quotaMessage(reason: string) {
  switch (reason) {
    case 'cooldown': return '请稍等几秒，再继续这场茶歇。'
    case 'session_limit': return '这次茶歇的访客额度已经用完了。'
    case 'source_daily_limit': return '今天的 Tea 访客额度已经用完了。'
    case 'daily_budget': return '今天的访客 AI 总额度已经用完了。'
    default: return 'Tea AI 暂未开放。'
  }
}

export function createTeaHttpHandler(dependencies: Dependencies) {
  return async function handle(request: Request) {
    if (!hasAllowedOrigin(request, dependencies.siteOrigin)) {
      return json({ error: 'Origin not allowed' }, 403)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = teaGatewayRequestSchema.safeParse(body)
    if (!parsed.success) return json({ error: 'Tea 请求内容不符合要求。' }, 400)

    const address = await dependencies.getClientAddress(request)
    const sourceHash = createHmac('sha256', dependencies.fingerprintSecret)
      .update(`tea\0${address}`)
      .digest('hex')

    try {
      const result = await dependencies.service.complete({
        request: parsed.data,
        sourceHash,
        now: new Date(),
        signal:request.signal,
      })
      return json({ content: result.content }, 200)
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        return json({ error: 'Tea AI 暂未开放。' }, 503, { 'retry-after': '60' })
      }
      if (error instanceof AiBusyError) {
        return json({ error: '现在有人正在使用茶室，请稍后再试。' }, 503, { 'retry-after': '2' })
      }
      if (error instanceof AiQuotaError) {
        const status = error.reason === 'disabled' ? 503 : 429
        return json({ error: quotaMessage(error.reason) }, status, { 'retry-after': error.reason === 'cooldown' ? '3' : '3600' })
      }
      if (error instanceof AiProviderError) {
        if(error.code==='output_truncated')return json({error:'回复达到输出上限，未作为完整结果保存，请重试。'},502)
        return json({ error: 'Tea AI 暂时没有回应，请稍后再试。' }, 502)
      }
      return json({ error: 'Tea 暂时无法继续，请稍后再试。' }, 500)
    }
  }
}
