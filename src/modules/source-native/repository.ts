import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { ownerSourceRecords } from '@/db/schema'
import { ownerKnowledgeRepository } from '@/modules/owner-memory/runtime'
import { withoutProviderSecrets } from './contracts'

export async function seedSourceKnowledge() {
  await db.transaction(async (tx) => {
    // Serialize the one-time compatibility migration, including empty databases.
    await tx.execute("select pg_advisory_xact_lock(7152033)")
    const [marker] = await tx.select().from(ownerSourceRecords).where(and(eq(ownerSourceRecords.store, '_migration'), eq(ownerSourceRecords.key, 'knowledge-v1')))
    if (marker) return
    const [companions, threads, memories] = await Promise.all([ownerKnowledgeRepository.listCompanions(), ownerKnowledgeRepository.listThreads(), ownerKnowledgeRepository.listMemories()])
    const rows: Array<typeof ownerSourceRecords.$inferInsert> = []
    for (const c of companions) {
      rows.push({ store: 'apiConfigs', key: c.id, value: { id: c.id, nickname: c.name, model: 'Site AI', provider: 'openai', systemPrompt: c.systemPrompt, personality: c.description, memory: c.memoryEnabled, autoMem: c.autoMemoryEnabled, amMode: c.autoMemoryMode, amBudget: c.autoMemoryBudget, archived: !c.enabled } })
      for (const a of [...await ownerKnowledgeRepository.listAutoMemories(c.id), ...await ownerKnowledgeRepository.listAutoMemories(c.id, true)]) rows.push({ store: 'autoMemory', key: a.id, value: { ...a, friendId: c.id, created: a.createdAt.getTime(), updated: a.updatedAt.getTime() } })
    }
    for (const t of threads) {
      rows.push({ store: 'chatThreads', key: t.id, value: { id: t.id, friendId: t.companionId, name: t.title, memoryEnabled: true, created: t.createdAt.getTime() } })
      const thread = await ownerKnowledgeRepository.getThread(t.id)
      for (const m of thread?.messages ?? []) rows.push({ store: 'chatMessages', key: m.id, value: { id: m.id, threadId: t.id, friendId: t.companionId, role: m.role, content: m.content, timestamp: m.createdAt.getTime() } })
    }
    for (const m of memories) rows.push({ store: 'memories', key: m.id, value: { ...m, created: m.createdAt.getTime(), lastActivated: m.lastActivatedAt.getTime(), createdBy: m.createdByCompanionId ?? 'user' } })
    rows.push({ store: '_migration', key: 'knowledge-v1', value: { done: true } })
    await tx.insert(ownerSourceRecords).values(rows).onConflictDoNothing()
  })
}

export async function readSourceRecords(store?: string) {
  if (store) return db.select().from(ownerSourceRecords).where(eq(ownerSourceRecords.store, store))
  await seedSourceKnowledge()
  await db.insert(ownerSourceRecords).values({ store: 'about', key: 'main', value: { id: 'main', name: 'Keleoz' } }).onConflictDoNothing()
  return db.select().from(ownerSourceRecords)
}

export async function readSourceCategories(){
  const rows=await db.select({name:ownerSourceRecords.key}).from(ownerSourceRecords).where(eq(ownerSourceRecords.store,'categories'))
  return rows.map(row=>row.name)
}

export class SourceRecordConflictError extends Error {
  constructor() { super('source_record_conflict') }
}

function checkSourceRevision(existing: { updatedAt: Date } | undefined, expectedUpdatedAt: string | null | undefined) {
  if (expectedUpdatedAt === undefined) return
  if (expectedUpdatedAt === null ? Boolean(existing) : !existing || existing.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new SourceRecordConflictError()
  }
}

export async function writeSourceRecord(store: string, key: string, value: Record<string, unknown>, expectedUpdatedAt?: string | null) {
  const record: Record<string, unknown> = { ...value, ...(store === 'categories' ? { name: key } : { id: key }) }
  delete record.expectedUpdatedAt
  const safe = store === 'apiConfigs' || store === 'apiSettings' ? withoutProviderSecrets(record) : record
  return db.transaction(async tx => {
    // The same lock covers missing rows, so competing creates and deletes also serialize.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${JSON.stringify([store, key])}, 7152035))`)
    const [existing] = await tx.select({ updatedAt: ownerSourceRecords.updatedAt }).from(ownerSourceRecords).where(and(eq(ownerSourceRecords.store, store), eq(ownerSourceRecords.key, key)))
    checkSourceRevision(existing, expectedUpdatedAt)
    // Tokens round-trip through JavaScript dates; never emit two versions in one millisecond.
    const updatedAt = new Date(Math.max(Date.now(), (existing?.updatedAt.getTime() ?? -1) + 1))
    await tx.insert(ownerSourceRecords).values({ store, key, value: safe, updatedAt }).onConflictDoUpdate({ target: [ownerSourceRecords.store, ownerSourceRecords.key], set: { value: safe, updatedAt } })
    return { value: safe, updatedAt }
  })
}

export async function deleteSourceRecord(store: string, key: string, expectedUpdatedAt?: string | null) {
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${JSON.stringify([store, key])}, 7152035))`)
    const [existing] = await tx.select({ updatedAt: ownerSourceRecords.updatedAt }).from(ownerSourceRecords).where(and(eq(ownerSourceRecords.store, store), eq(ownerSourceRecords.key, key)))
    checkSourceRevision(existing, expectedUpdatedAt)
    await tx.delete(ownerSourceRecords).where(and(eq(ownerSourceRecords.store, store), eq(ownerSourceRecords.key, key)))
  })
}
