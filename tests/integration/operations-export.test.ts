import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createOperationsRepository } from '@/modules/operations/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const operations = createOperationsRepository(drizzle(pool, { schema }))

beforeEach(async () => {
  await pool.query('delete from ai_usage_events')
  await pool.query('delete from letters')
  await pool.query('delete from operation_settings')
})

afterAll(async () => {
  await pool.query('delete from operation_settings')
  await pool.query('delete from ai_usage_events')
  await pool.query('delete from letters')
  await pool.end()
})

describe('portable Owner export', () => {
  it('includes owned content/configuration but excludes authentication, fingerprints and raw AI events', async () => {
    await pool.query(`
      insert into letters (postal_code, sender_name, content, visibility, status, source_hash)
      values ('260903', 'Visitor', 'A portable letter', 'private', 'pending', 'private-letter-fingerprint')
    `)
    await pool.query(`
      insert into ai_usage_events
        (feature, source_hash, session_id, status, provider, model, input_characters, reserved_cost_micro_usd)
      values ('tea', 'private-ai-fingerprint', '11111111-1111-4111-8111-111111111111', 'reserved', 'provider', 'secret-model-name', 12, 45)
    `)
    await operations.setGuestAiEnabled(false, new Date('2026-09-03T00:00:00.000Z'))

    const exported = await operations.createPortableExport({
      ownerUsername: 'continuum-owner',
      generatedAt: new Date('2026-09-03T10:30:00.000Z'),
    })
    const serialized = JSON.stringify(exported)

    expect(exported).toMatchObject({
      format: 'keleoz-continuum-export',
      schemaVersion: 1,
      owner: { username: 'continuum-owner' },
      settings: { guestAiEnabled: false },
    })
    expect(exported.letters).toEqual(expect.arrayContaining([
      expect.objectContaining({ postalCode: '260903', senderName: 'Visitor', content: 'A portable letter' }),
    ]))
    expect(serialized).not.toContain('private-letter-fingerprint')
    expect(serialized).not.toContain('private-ai-fingerprint')
    expect(serialized).not.toContain('secret-model-name')
    expect(serialized).not.toContain('passwordHash')
    expect(serialized).not.toContain('tokenHash')
  })
})
