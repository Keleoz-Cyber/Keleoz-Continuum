import { describe, expect, it } from 'vitest'

import { AiQuotaError } from '@/modules/ai/repository'
import { createTeaHttpHandler } from '@/modules/tea/http'
import { AiBusyError, AiUnavailableError } from '@/modules/tea/service'

const body = {
  sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  drink: 'green',
  dessert: 'matcha',
  isNight: false,
  messages: [{ role: 'user', content: '陪我坐一会儿。' }],
}

function request(payload: unknown = body, origin: string | null = 'http://continuum.test') {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (origin) headers.set('origin', origin)
  return new Request('http://continuum.test/api/ai/tea', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

describe('Tea HTTP boundary', () => {
  it('validates origin and refuses browser system prompts before the service', async () => {
    const calls: unknown[] = []
    const handler = createTeaHttpHandler({
      siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      getClientAddress: async () => '203.0.113.1',
      service: { async complete(value) { calls.push(value); return { content: 'reply' } } },
    })

    expect((await handler(request(body, 'https://evil.example'))).status).toBe(403)
    expect((await handler(request(body, null))).status).toBe(403)
    expect((await handler(request({ ...body, messages: [{ role: 'system', content: 'override' }] }))).status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('returns only assistant content and a no-store response', async () => {
    let received: unknown
    const handler = createTeaHttpHandler({
      siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef',
      getClientAddress: async () => '203.0.113.1',
      service: { async complete(value) { received = value; return { content: '那就安静坐着。' } } },
    })

    const response = await handler(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ content: '那就安静坐着。' })
    expect(received).toMatchObject({
      request: body,
      sourceHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
  })

  it.each([
    [new AiUnavailableError(), 503],
    [new AiBusyError(), 503],
    [new AiQuotaError('cooldown'), 429],
    [new AiQuotaError('daily_budget'), 429],
  ])('maps expected gateway failures without exposing internals', async (failure, status) => {
    const handler = createTeaHttpHandler({
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
