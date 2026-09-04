import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createOwnerKnowledgeRepository } from '@/modules/owner-memory/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createOwnerKnowledgeRepository(drizzle(pool, { schema }))
const now = new Date('2026-09-05T01:00:00.000Z')

beforeEach(async () => {
  await pool.query('delete from owner_auto_memories')
  await pool.query('delete from owner_chat_messages')
  await pool.query('delete from owner_chat_threads')
  await pool.query('delete from owner_memories')
  await pool.query('delete from owner_chat_companions')
})

afterAll(async () => {
  await pool.end()
})

describe('Owner knowledge repository', () => {
  it('persists companions, threads and ordered private messages', async () => {
    const companion = await repository.createCompanion({
      name: 'Nightingale',
      description: '安静的夜间同行者',
      systemPrompt: '保持诚实、克制和温柔。',
      memoryEnabled: true,
      autoMemoryEnabled: true,
      now,
    })
    const thread = await repository.createThread({ companionId: companion.id, title: '雨夜', now })
    await repository.appendMessage({ threadId: thread.id, role: 'user', content: '今晚下雨。', now })
    await repository.appendMessage({ threadId: thread.id, role: 'assistant', content: '我听见了。', now: new Date(now.getTime() + 1_000), promptTokens: 12, completionTokens: 8 })

    const loaded = await repository.getThread(thread.id)

    expect(loaded).toMatchObject({ title: '雨夜', companion: { name: 'Nightingale' } })
    expect(loaded?.messages.map((message) => [message.role, message.content])).toEqual([
      ['user', '今晚下雨。'],
      ['assistant', '我听见了。'],
    ])
  })

  it('filters Memory with source visibility rules and records activation', async () => {
    const first = await repository.createCompanion({ name: 'First', systemPrompt: 'First', now })
    const second = await repository.createCompanion({ name: 'Second', systemPrompt: 'Second', now })
    const visible = await repository.createMemory({
      title: '只给 First', summary: '', content: '蓝色窗户', oneLine: '', domain: '日常', tags: ['蓝色'],
      valence: 0.6, arousal: 0.4, importance: 7, pinned: false, resolved: false,
      visibility: 'only', visibleTo: [first.id], excludeFrom: [], now,
    })
    await repository.createMemory({
      title: 'Private', summary: '', content: '不能注入', oneLine: '', domain: '情感', tags: [],
      valence: 0.2, arousal: 0.8, importance: 8, pinned: false, resolved: false,
      visibility: 'private', visibleTo: [], excludeFrom: [], now,
    })

    expect((await repository.listMemories({ companionId: first.id, now })).map((item) => item.id)).toEqual([visible.id])
    expect(await repository.listMemories({ companionId: second.id, now })).toEqual([])
    await repository.activateMemories([visible.id], new Date(now.getTime() + 2_000))
    expect((await repository.getMemory(visible.id))?.activationCount).toBe(1)
  })

  it('applies at most three scoped Auto Memory operations and enforces the always cap', async () => {
    const companion = await repository.createCompanion({ name: 'Archivist', systemPrompt: 'Remember carefully', autoMemoryEnabled: true, now })
    const results = await repository.applyAutoMemoryOperations({
      companionId: companion.id,
      authorName: companion.name,
      now,
      operations: Array.from({ length: 4 }, (_, index) => ({
        kind: 'create' as const,
        category: 'personal_context',
        priority: 'always',
        id: null,
        content: `核心记忆 ${index + 1}`,
      })),
    })

    expect(results.map((result) => result.ok)).toEqual([true, true, true, false])
    expect(await repository.listAutoMemories(companion.id)).toHaveLength(3)
  })

  it('updates and removes Owner-managed Memory and Auto Memory records', async () => {
    const companion = await repository.createCompanion({ name: 'Editor', systemPrompt: 'Edit carefully', now })
    await repository.updateCompanion({ id: companion.id, name: 'Edited', description: 'updated', systemPrompt: 'New prompt', memoryEnabled: false, autoMemoryEnabled: true, now })
    expect((await repository.listCompanions())[0]).toMatchObject({ name: 'Edited', memoryEnabled: false })
    const memory = await repository.createMemory({
      title: 'Draft', summary: '', content: 'Before', oneLine: '', domain: '思考', tags: [], valence: 0.5, arousal: 0.3,
      importance: 5, pinned: false, resolved: false, visibility: 'public', visibleTo: [], excludeFrom: [], now,
    })
    await repository.updateMemory({ ...memory, title: 'After', content: 'Changed', tags: ['edited'], pinned: true, resolved: true, now })
    expect(await repository.getMemory(memory.id)).toMatchObject({ title: 'After', content: 'Changed', tags: ['edited'], pinned: true, resolved: true })
    const [created] = await repository.applyAutoMemoryOperations({ companionId: companion.id, authorName: 'Edited', now, operations: [{ kind: 'create', category: 'work_context', priority: 'normal', id: null, content: 'Working' }] })
    const [auto] = await repository.listAutoMemories(companion.id)
    expect(created?.ok).toBe(true)
    await repository.updateAutoMemory({ id: auto!.id, companionId: companion.id, content: 'Updated work', priority: 'low', archived: true, now })
    expect(await repository.listAutoMemories(companion.id, true)).toEqual(expect.arrayContaining([expect.objectContaining({ content: 'Updated work', priority: 'low' })]))
    await repository.deleteAutoMemory(auto!.id, companion.id)
    await repository.deleteMemory(memory.id)
    expect(await repository.getMemory(memory.id)).toBeNull()
    expect(await repository.listAutoMemories(companion.id, true)).toEqual([])
  })
})
