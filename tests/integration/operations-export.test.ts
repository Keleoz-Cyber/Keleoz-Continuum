import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createOperationsRepository } from '@/modules/operations/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const operations = createOperationsRepository(drizzle(pool, { schema }))

beforeEach(async () => {
  await pool.query('delete from ai_usage_events')
  await pool.query('delete from owner_chat_messages')
  await pool.query('delete from owner_chat_threads')
  await pool.query('delete from owner_memories')
  await pool.query('delete from owner_auto_memories')
  await pool.query('delete from owner_chat_companions')
  await pool.query('delete from letters')
  await pool.query('delete from operation_settings')
})

afterAll(async () => {
  await pool.query('delete from owner_chat_messages')
  await pool.query('delete from owner_chat_threads')
  await pool.query('delete from owner_memories')
  await pool.query('delete from owner_auto_memories')
  await pool.query('delete from owner_chat_companions')
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
    const companion = await pool.query<{ id: string }>(`
      insert into owner_chat_companions (name, description, system_prompt)
      values ('Archivist', 'Keeps context', 'Private companion prompt') returning id
    `)
    const companionId = companion.rows[0]!.id
    const thread = await pool.query<{ id: string }>(`
      insert into owner_chat_threads (companion_id, title)
      values ($1, 'Portable conversation') returning id
    `, [companionId])
    await pool.query(`
      insert into owner_chat_messages (thread_id, role, content)
      values ($1, 'user', 'Remember this exchange')
    `, [thread.rows[0]!.id])
    await pool.query(`
      insert into owner_memories (title, content, one_line, domain)
      values ('A durable memory', 'Memory body', 'One line', '日常')
    `)
    await pool.query(`
      insert into owner_auto_memories (companion_id, category, priority, content, updated_by)
      values ($1, 'personal_context', 'normal', 'Prefers source fidelity', 'Archivist')
    `, [companionId])
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
    expect(exported.knowledge).toMatchObject({
      companions: [expect.objectContaining({ name: 'Archivist', systemPrompt: 'Private companion prompt' })],
      threads: [expect.objectContaining({ title: 'Portable conversation' })],
      messages: [expect.objectContaining({ role: 'user', content: 'Remember this exchange' })],
      memories: [expect.objectContaining({ title: 'A durable memory', content: 'Memory body' })],
      autoMemories: [expect.objectContaining({ content: 'Prefers source fidelity' })],
    })
    expect(serialized).not.toContain('private-letter-fingerprint')
    expect(serialized).not.toContain('private-ai-fingerprint')
    expect(serialized).not.toContain('secret-model-name')
    expect(serialized).not.toContain('passwordHash')
    expect(serialized).not.toContain('tokenHash')
  })
})
