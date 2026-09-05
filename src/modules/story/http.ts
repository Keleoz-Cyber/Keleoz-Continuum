import { createHmac } from 'node:crypto'

import { AiProviderError } from '@/modules/ai/provider'
import { AiQuotaError } from '@/modules/ai/repository'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { storyGatewayRequestSchema, type StoryGatewayRequest } from './contracts'
import { createStoryDocumentGrantManager } from './document-grant'
import { StoryBusyError, StoryUnavailableError } from './service'

type Dependencies = {
  siteOrigin: string
  fingerprintSecret: string
  getClientAddress(request: Request): Promise<string>
  service: {
    complete(input: { request: StoryGatewayRequest; sourceHash: string; now: Date;signal?:AbortSignal }): Promise<{
      content: string
      truncated: boolean
    }>
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
    case 'cooldown': return '请稍等片刻，再继续故事。'
    case 'session_limit': return '这次 Story 的访客额度已经用完了。'
    case 'source_daily_limit': return '今天的 Story 访客额度已经用完了。'
    case 'daily_budget': return '今天的访客 AI 总额度已经用完了。'
    default: return 'Story AI 暂未开放。'
  }
}

export function createStoryHttpHandler(dependencies: Dependencies) {
  const documentGrants = createStoryDocumentGrantManager(dependencies.fingerprintSecret)

  function endingReply(content: string) {
    try {
      const start = content.indexOf('{')
      const end = content.lastIndexOf('}')
      if (start < 0 || end <= start) return false
      const value = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>
      return value.isEnding === true
    } catch {
      return false
    }
  }

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
    const parsed = storyGatewayRequestSchema.safeParse(body)
    if (!parsed.success) return json({ error: 'Story 请求内容不符合要求。' }, 400)

    const now = new Date()
    const rollback=parsed.data.mode==='document'?documentGrants.claim(parsed.data,now):null
    if (parsed.data.mode === 'document' && !rollback) {
      return json({ error: 'Story 文档授权无效或已使用。' }, 403)
    }

    try {
      const address = await dependencies.getClientAddress(request)
      const sourceHash = createHmac('sha256', dependencies.fingerprintSecret)
        .update(`story\0${address}`)
        .digest('hex')
      const result = await dependencies.service.complete({
        request: parsed.data,
        sourceHash,
        now,
        signal:request.signal,
      })
      let documentGrant: string | undefined
      if (parsed.data.mode === 'turn' && parsed.data.messages.length >= 23 && endingReply(result.content)) {
        documentGrant = documentGrants.issue({
          ...parsed.data,
          mode: 'document',
          messages: [...parsed.data.messages, { role: 'assistant', content: result.content.trim() }],
          documentSoFar: '',
          documentSegment: 0,
        }, now)
      } else if (parsed.data.mode === 'document' && result.truncated && parsed.data.documentSegment < 3) {
        documentGrant = documentGrants.issue({
          ...parsed.data,
          documentSoFar: parsed.data.documentSoFar + result.content,
          documentSegment: parsed.data.documentSegment + 1,
        }, now)
      }
      return json(documentGrant ? { ...result, documentGrant } : result, 200)
    } catch (error) {
      rollback?.(new Date())
      if(error instanceof AiProviderError&&error.code==='output_truncated')return json({error:'剧情输出达到上限，未推进故事，请重试。'},502)
      if (error instanceof StoryUnavailableError) {
        return json({ error: 'Story AI 暂未开放。' }, 503, { 'retry-after': '60' })
      }
      if (error instanceof StoryBusyError) {
        return json({ error: '现在有人正在使用故事主持人，请稍后再试。' }, 503, { 'retry-after': '2' })
      }
      if (error instanceof AiQuotaError) {
        const status = error.reason === 'disabled' ? 503 : 429
        return json({ error: quotaMessage(error.reason) }, status, {
          'retry-after': error.reason === 'cooldown' ? '1' : '3600',
        })
      }
      if (error instanceof AiProviderError) {
        return json({ error: 'Story AI 暂时没有回应，请稍后再试。' }, 502)
      }
      return json({ error: 'Story 暂时无法继续，请稍后再试。' }, 500)
    }
  }
}
