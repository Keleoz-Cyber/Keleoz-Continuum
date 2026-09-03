import { describe, expect, it } from 'vitest'

import { createPortableExportHttpHandler } from '@/modules/operations/http'

describe('portable export HTTP boundary', () => {
  it('returns 401 instead of redirecting an unauthenticated API request', async () => {
    const handler = createPortableExportHttpHandler({
      getOwner: async () => null,
      createExport: async () => ({ format: 'unreachable' }),
      now: () => new Date('2026-09-03T10:30:00.000Z'),
    })

    const response = await handler()

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ code: 'unauthorized' })
  })

  it('downloads a no-store UTF-8 JSON snapshot for the authenticated Owner', async () => {
    const handler = createPortableExportHttpHandler({
      getOwner: async () => ({ id: 'owner-id', username: 'keleoz' }),
      createExport: async ({ ownerUsername, generatedAt }) => ({
        format: 'keleoz-continuum-export', ownerUsername, generatedAt: generatedAt.toISOString(),
      }),
      now: () => new Date('2026-09-03T10:30:00.000Z'),
    })

    const response = await handler()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="keleoz-continuum-20260903T103000Z.json"')
    expect(await response.json()).toMatchObject({ ownerUsername: 'keleoz', generatedAt: '2026-09-03T10:30:00.000Z' })
  })
})
