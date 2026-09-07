import { randomUUID } from 'node:crypto'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import * as schema from '@/db/schema'
import { createTestPool } from '@/test/db'

const isolated = vi.hoisted(() => ({ database: null as unknown as NodePgDatabase<typeof schema> }))
vi.mock('server-only', () => ({}))
vi.mock('@/db/client', () => ({ get db() { return isolated.database } }))
vi.mock('@/modules/owner-memory/runtime', () => ({ ownerKnowledgeRepository: {} }))
import { deleteSourceRecord, writeSourceRecord } from '@/modules/source-native/repository'

const pool = createTestPool()
const keys: string[] = []
const fixtureKey = () => { const key = `source-cas-${randomUUID()}`; keys.push(key); return key }
beforeAll(async () => {
  const result = await pool.query('select current_database() as name')
  if (result.rows[0].name !== 'continuum_test') throw new Error('Concurrency tests require the isolated continuum_test database')
  isolated.database = drizzle(pool, { schema })
})
afterAll(async () => {
  if (isolated.database && keys.length) await pool.query("delete from owner_source_records where store='memories' and key=any($1::text[])", [keys])
  await pool.end()
})

it('rejects stale activation writes after permission revocation or deletion', async () => {
  const key = fixtureKey()
  await writeSourceRecord('memories', key, { visibility: 'public' })
  const old = (await pool.query("select updated_at from owner_source_records where store='memories' and key=$1", [key])).rows[0].updated_at.toISOString()
  await writeSourceRecord('memories', key, { visibility: 'private' })
  await expect(writeSourceRecord('memories', key, { visibility: 'public', activationCount: 1 }, old)).rejects.toThrow('source_record_conflict')
  expect((await pool.query("select value from owner_source_records where store='memories' and key=$1", [key])).rows[0].value.visibility).toBe('private')
  await deleteSourceRecord('memories', key)
  await expect(writeSourceRecord('memories', key, { visibility: 'public' }, old)).rejects.toThrow('source_record_conflict')
  expect((await pool.query("select key from owner_source_records where store='memories' and key=$1", [key])).rows).toHaveLength(0)
})

it('allows one of two concurrent create-only writes and returns the persisted revision', async () => {
  const key = fixtureKey()
  const results = await Promise.allSettled([
    writeSourceRecord('memories', key, { title: 'first' }, null),
    writeSourceRecord('memories', key, { title: 'second' }, null),
  ])
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
  const saved = results.find(result => result.status === 'fulfilled')!
  if (saved.status !== 'fulfilled') throw new Error('Expected one successful create')
  const row = (await pool.query("select value,updated_at from owner_source_records where store='memories' and key=$1", [key])).rows[0]
  expect(saved.value).toEqual({ value: row.value, updatedAt: row.updated_at })
})

it('increments millisecond revisions monotonically and rejects stale deletes', async () => {
  const key = fixtureKey()
  const future = new Date(Date.now() + 60_000)
  await pool.query("insert into owner_source_records(store,key,value,updated_at) values('memories',$1,$2,$3)", [key, { id: key }, future])
  const saved = await writeSourceRecord('memories', key, { title: 'updated' }, future.toISOString())
  expect(saved.updatedAt.getTime()).toBe(future.getTime() + 1)
  await expect(deleteSourceRecord('memories', key, future.toISOString())).rejects.toThrow('source_record_conflict')
  await deleteSourceRecord('memories', key, saved.updatedAt.toISOString())
  await expect(deleteSourceRecord('memories', key, saved.updatedAt.toISOString())).rejects.toThrow('source_record_conflict')
})

it('accepts only one concurrent update for the same expected revision', async () => {
  const key = fixtureKey()
  const initial = await writeSourceRecord('memories', key, { title: 'before', expectedUpdatedAt: 'must-not-persist' }, null)
  expect(initial.value).not.toHaveProperty('expectedUpdatedAt')
  const results = await Promise.allSettled([
    writeSourceRecord('memories', key, { title: 'first' }, initial.updatedAt.toISOString()),
    writeSourceRecord('memories', key, { title: 'second' }, initial.updatedAt.toISOString()),
  ])
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
})
