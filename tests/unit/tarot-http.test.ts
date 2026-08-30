import { describe, expect, it } from 'vitest'

import { createTarotHttpHandler } from '@/modules/tarot/http'
import { TarotUnavailableError } from '@/modules/tarot/service'

const reading = { mode: 'reading', sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  spread: 'single', guide: false, cards: [{ cardId: 'major:11', reversed: false }] }
function request(body: unknown, origin = 'http://continuum.test') {
  return new Request('http://continuum.test/api/ai/tarot', { method: 'POST',
    headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) })
}

describe('Tarot HTTP boundary', () => {
  it('issues and chains one-time follow-up grants without exposing server prompts', async () => {
    const calls: unknown[] = []
    const handler = createTarotHttpHandler({ siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef', getClientAddress: async () => '203.0.113.1',
      service: { async complete(value) { calls.push(value); return { content: calls.length === 1 ? '初次解读。' : '进一步解读。' } } } })
    const initial = await handler(request(reading))
    const initialBody = await initial.json() as Record<string, unknown>
    expect(initialBody).toMatchObject({ content: '初次解读。', followupGrant: expect.any(String) })

    const followup = { ...reading, mode: 'followup', followupIndex: 0,
      followupGrant: initialBody.followupGrant, history: [{ role: 'assistant', content: '初次解读。' }], question: '请更详细地说明。' }
    const next = await handler(request(followup))
    expect(await next.json()).toMatchObject({ content: '进一步解读。', followupGrant: expect.any(String) })
    expect((await handler(request(followup))).status).toBe(403)
    expect(calls).toHaveLength(2)
  })

  it('validates exact Origin and maps the disabled gateway safely', async () => {
    const handler = createTarotHttpHandler({ siteOrigin: 'http://continuum.test',
      fingerprintSecret: '0123456789abcdef0123456789abcdef', getClientAddress: async () => 'unknown',
      service: { async complete() { throw new TarotUnavailableError() } } })
    expect((await handler(request(reading, 'https://evil.example'))).status).toBe(403)
    expect((await handler(request(reading))).status).toBe(503)
  })
})
