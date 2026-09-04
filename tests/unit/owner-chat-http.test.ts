import { describe, expect, it, vi } from 'vitest'

import { createOwnerChatHttpHandler } from '@/modules/owner-chat/http'

describe('Owner Chat HTTP boundary', () => {
  it('requires an authenticated Owner and exact same origin', async () => {
    const send = vi.fn()
    const unauthorized = createOwnerChatHttpHandler({ siteOrigin: 'http://continuum.test', getOwner: async () => null, send })
    expect((await unauthorized(new Request('http://continuum.test/api/studio/chat', { method: 'POST' }))).status).toBe(401)

    const wrongOrigin = createOwnerChatHttpHandler({ siteOrigin: 'http://continuum.test', getOwner: async () => ({ id: 'owner', username: 'admin' }), send })
    expect((await wrongOrigin(new Request('http://continuum.test/api/studio/chat', { method: 'POST', headers: { origin: 'https://evil.test', 'content-type': 'application/json' }, body: '{}' }))).status).toBe(403)
    expect(send).not.toHaveBeenCalled()
  })

  it('validates and forwards one bounded private message', async () => {
    const send = vi.fn(async () => ({ content: 'reply', autoMemoryEvents: [], truncated: false }))
    const handler = createOwnerChatHttpHandler({
      siteOrigin: 'http://continuum.test',
      getOwner: async () => ({ id: 'owner-id', username: 'admin' }),
      send,
      now: () => new Date('2026-09-05T03:00:00.000Z'),
    })
    const response = await handler(new Request('http://continuum.test/api/studio/chat', {
      method: 'POST', headers: { origin: 'http://continuum.test', 'content-type': 'application/json' },
      body: JSON.stringify({ threadId: '11111111-1111-4111-8111-111111111111', content: ' hello ' }),
    }))

    expect(response.status).toBe(200)
    expect(send).toHaveBeenCalledWith({ ownerId: 'owner-id', threadId: '11111111-1111-4111-8111-111111111111', content: 'hello', now: new Date('2026-09-05T03:00:00.000Z') })
  })
})
