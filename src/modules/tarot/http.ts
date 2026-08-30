import { createHmac } from 'node:crypto'
import { AiProviderError } from '@/modules/ai/provider'
import { AiQuotaError } from '@/modules/ai/repository'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { tarotGatewayRequestSchema, type TarotGatewayRequest } from './contracts'
import { createTarotFollowupGrantManager } from './followup-grant'
import { TarotBusyError, TarotUnavailableError } from './service'

type Dependencies = { siteOrigin: string; fingerprintSecret: string; getClientAddress(request: Request): Promise<string>;
  service: { complete(input: { request: TarotGatewayRequest; sourceHash: string; now: Date }): Promise<{ content: string }> } }
function json(body: unknown, status: number, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } })
}
export function createTarotHttpHandler(dependencies: Dependencies) {
  const grants = createTarotFollowupGrantManager(dependencies.fingerprintSecret)
  return async function handle(request: Request) {
    if (!hasAllowedOrigin(request, dependencies.siteOrigin)) return json({ error: 'Origin not allowed' }, 403)
    let body: unknown
    try { body = await request.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
    const parsed = tarotGatewayRequestSchema.safeParse(body)
    if (!parsed.success) return json({ error: 'Tarot 请求内容不符合要求。' }, 400)
    const now = new Date()
    if (parsed.data.mode === 'followup' && !grants.consume(parsed.data, now)) {
      return json({ error: 'Tarot 追问授权无效或已使用。' }, 403)
    }
    const address = await dependencies.getClientAddress(request)
    const sourceHash = createHmac('sha256', dependencies.fingerprintSecret).update(`tarot\0${address}`).digest('hex')
    try {
      const result = await dependencies.service.complete({ request: parsed.data, sourceHash, now })
      let followupGrant: string | undefined
      if (parsed.data.mode === 'reading') {
        followupGrant = grants.issue({ ...parsed.data, followupIndex: 0,
          history: [{ role: 'assistant', content: result.content }] }, now)
      } else if (parsed.data.followupIndex < 2) {
        followupGrant = grants.issue({ ...parsed.data, followupIndex: parsed.data.followupIndex + 1,
          history: [...parsed.data.history, { role: 'user', content: parsed.data.question }, { role: 'assistant', content: result.content }] }, now)
      }
      return json(followupGrant ? { ...result, followupGrant } : result, 200)
    } catch (error) {
      if (error instanceof TarotUnavailableError) return json({ error: 'Tarot AI 暂未开放。' }, 503, { 'retry-after': '60' })
      if (error instanceof TarotBusyError) return json({ error: '现在有人正在进行占卜，请稍后再试。' }, 503, { 'retry-after': '2' })
      if (error instanceof AiQuotaError) return json({ error: 'Tarot 访客额度暂时不可用。' }, error.reason === 'disabled' ? 503 : 429)
      if (error instanceof AiProviderError) return json({ error: 'Tarot AI 暂时没有回应，请稍后再试。' }, 502)
      return json({ error: 'Tarot 暂时无法继续，请稍后再试。' }, 500)
    }
  }
}
