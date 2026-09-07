import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ write: vi.fn(), remove: vi.fn(), owner: vi.fn() }))
vi.mock('@/modules/auth/dal', () => ({ getCurrentOwner: mocks.owner }))
vi.mock('@/shared/env', () => ({ serverEnv: { SITE_ORIGIN: 'http://continuum.test' } }))
vi.mock('@/modules/source-native/repository', () => ({
  writeSourceRecord: mocks.write, deleteSourceRecord: mocks.remove, readSourceRecords: vi.fn(),
  SourceRecordConflictError: class extends Error { constructor() { super('source_record_conflict') } },
}))
import { SourceRecordConflictError } from '@/modules/source-native/repository'
import { POST } from '@/app/api/studio/source-records/route'
import { sourceWrite } from '@/modules/source-native/contracts'
const revision = '2026-09-05T03:00:00.001Z'
const request = (body: unknown) => new Request('http://continuum.test/api/studio/source-records', {
  method: 'POST', headers: { origin: 'http://continuum.test', 'content-type': 'application/json' }, body: JSON.stringify(body),
})
beforeEach(() => { vi.clearAllMocks(); mocks.owner.mockResolvedValue({ id: 'owner' }) })

it('accepts nullable revisions and rejects malformed version tokens', () => {
  const body = { op: 'put', store: 'memories', key: 'memory', value: {} }
  expect(sourceWrite.parse({ ...body, expectedUpdatedAt: null })).toHaveProperty('expectedUpdatedAt', null)
  expect(sourceWrite.parse({ ...body, expectedUpdatedAt: revision })).toHaveProperty('expectedUpdatedAt', revision)
  expect(sourceWrite.safeParse({ ...body, expectedUpdatedAt: 'not-a-date' }).success).toBe(false)
})

it('returns the saved value shape with revision metadata outside stored data', async () => {
  const value = { id: 'memory', title: 'saved' }
  mocks.write.mockResolvedValue({ value, updatedAt: new Date(revision) })
  const response = await POST(request({ op: 'put', store: 'memories', key: 'memory', value, expectedUpdatedAt: null }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual(value)
  expect(response.headers.get('X-Source-Revision')).toBe(revision)
  expect(mocks.write).toHaveBeenCalledWith('memories', 'memory', value, null)
})

it.each(['put', 'delete'])('returns 409 when a %s races a newer record', async op => {
  mocks.write.mockRejectedValue(new SourceRecordConflictError())
  mocks.remove.mockRejectedValue(new SourceRecordConflictError())
  const response = await POST(request({ op, store: 'memories', key: 'memory', value: {}, expectedUpdatedAt: revision }))
  expect(response.status).toBe(409)
  expect(await response.json()).toEqual({ error: 'source_record_conflict' })
})

it('requires Owner authentication before accepting a versioned write', async () => {
  mocks.owner.mockResolvedValue(null)
  expect((await POST(request({ op: 'delete', store: 'memories', key: 'memory', expectedUpdatedAt: revision }))).status).toBe(401)
  expect(mocks.remove).not.toHaveBeenCalled()
})
