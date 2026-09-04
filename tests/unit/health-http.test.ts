import { describe, expect, it } from 'vitest'

import { createHealthHttpHandler } from '@/modules/operations/health-http'

describe('production health endpoint', () => {
  it('returns ready only after the database responds', async () => {
    const handler = createHealthHttpHandler({
      checkDatabase: async () => undefined,
      startedAt: new Date('2026-09-04T00:00:00.000Z'),
      now: () => new Date('2026-09-04T00:01:30.000Z'),
    })

    const response = await handler()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'ready', database: 'ready', uptimeSeconds: 90 })
  })

  it('returns a bounded 503 without database error details', async () => {
    const handler = createHealthHttpHandler({
      checkDatabase: async () => { throw new Error('postgres://user:secret@db/private') },
      startedAt: new Date('2026-09-04T00:00:00.000Z'),
      now: () => new Date('2026-09-04T00:00:02.000Z'),
    })

    const response = await handler()
    const body = await response.text()

    expect(response.status).toBe(503)
    expect(body).toBe('{"status":"unavailable","database":"unavailable","uptimeSeconds":2}')
    expect(body).not.toContain('secret')
  })
})
