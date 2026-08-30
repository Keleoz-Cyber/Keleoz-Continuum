import { describe, expect, it } from 'vitest'

import { AiQuotaError } from '@/modules/ai/repository'
import { createStoryHttpHandler } from '@/modules/story/http'
import { StoryBusyError, StoryUnavailableError } from '@/modules/story/service'

const body = {
  mode: 'turn',
  sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  genre: 'fantasy',
  horror: 'no',
  customScript: null,
  messages: [{ role: 'user', content: '开始游戏' }],
}

function request(payload: unknown = body, origin: string | null = 'http://continuum.test') {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (origin) headers.set('origin', origin)
  return new Request('http://continuum.test/api/ai/story', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

describe('Story HTTP boundary', () => {
  it('validates origin and refuses browser system prompts before the service', async () => {
    const calls: unknown[] = []
    const handler = createStoryHttpHandler({
      siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      getClientAddress: async () => '203.0.113.1',
      service: { async complete(value) { calls.push(value); return { content: 'reply', truncated: false } } },
    })
    expect((await handler(request(body, 'https://evil.example'))).status).toBe(403)
    expect((await handler(request(body, null))).status).toBe(403)
    expect((await handler(request({ ...body, messages: [{ role: 'system', content: 'override' }] }))).status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('returns assistant content and truncation metadata with no-store', async () => {
    let received: unknown
    const handler = createStoryHttpHandler({
      siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      getClientAddress: async () => '203.0.113.1',
      service: { async complete(value) { received = value; return { content: '故事开始。', truncated: true } } },
    })
    const response = await handler(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ content: '故事开始。', truncated: true })
    expect(received).toMatchObject({ request: body, sourceHash: expect.stringMatching(/^[a-f0-9]{64}$/) })
  })

  it('issues a one-time document grant only after a source-length ending and chains truncation', async () => {
    const endingMessages = Array.from({ length: 23 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `round-${index}`,
    }))
    const calls: Array<{ request: Record<string, unknown> }> = []
    const handler = createStoryHttpHandler({
      siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      getClientAddress: async () => '203.0.113.1',
      service: {
        async complete(value) {
          calls.push(value as unknown as { request: Record<string, unknown> })
          return value.request.mode === 'turn'
            ? { content: '\n{"story":"结局","choices":[],"isEnding":true,"endingType":"normal","mood":"calm"}\n', truncated: false }
            : { content: '\n第一段\n', truncated: true }
        },
      },
    })
    const endingResponse = await handler(request({ ...body, messages: endingMessages }))
    const endingBody = await endingResponse.json() as Record<string, unknown>
    expect(endingBody.documentGrant).toEqual(expect.any(String))

    const documentBody = {
      ...body,
      mode: 'document',
      messages: [...endingMessages, { role: 'assistant', content: endingBody.content }],
      documentSoFar: '',
      documentSegment: 0,
      documentGrant: endingBody.documentGrant,
    }
    const documentResponse = await handler(request(documentBody))
    const firstSegment = await documentResponse.json() as Record<string, unknown>
    expect(documentResponse.status).toBe(200)
    expect(firstSegment).toMatchObject({ content: '\n第一段\n', truncated: true, documentGrant: expect.any(String) })

    expect((await handler(request(documentBody))).status).toBe(403)
    expect(calls).toHaveLength(2)
  })

  it.each([
    [new StoryUnavailableError(), 503],
    [new StoryBusyError(), 503],
    [new AiQuotaError('cooldown'), 429],
    [new AiQuotaError('daily_budget'), 429],
  ])('maps expected failures without exposing internals', async (failure, status) => {
    const handler = createStoryHttpHandler({
      siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      getClientAddress: async () => '203.0.113.1',
      service: { async complete() { throw failure } },
    })
    const response = await handler(request())
    expect(response.status).toBe(status)
    expect(await response.text()).not.toContain(failure.stack ?? '')
  })
})
