import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import {
  ownerAutoMemories,
  ownerChatCompanions,
  ownerChatMessages,
  ownerChatThreads,
  ownerMemories,
} from '@/db/schema'
import type * as schema from '@/db/schema'
import {
  calculateMemoryScore,
  isMemoryVisibleTo,
  type AutoMemoryOperation,
  type OwnerMemoryRecord,
} from '@/modules/owner-memory/contracts'

const AUTO_CATEGORIES = new Set(['work_context', 'personal_context', 'top_of_mind', 'brief_history', 'long_term_background', 'user_instructions'])
const AUTO_PRIORITIES = new Set(['always', 'normal', 'low'])

function toMemory(row: typeof ownerMemories.$inferSelect): OwnerMemoryRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    oneLine: row.oneLine,
    domain: row.domain,
    tags: row.tags,
    valence: row.valence,
    arousal: row.arousal,
    importance: row.importance,
    pinned: row.pinned,
    resolved: row.resolved,
    visibility: row.visibility,
    visibleTo: row.visibleTo,
    excludeFrom: row.excludeFrom,
    activationCount: row.activationCount,
    createdAt: row.createdAt,
    lastActivatedAt: row.lastActivatedAt,
    createdByCompanionId: row.createdByCompanionId,
    createdByName: row.createdByName,
  }
}

export function createOwnerKnowledgeRepository(database: NodePgDatabase<typeof schema>) {
  return {
    async createCompanion(input: {
      name: string
      description?: string
      systemPrompt: string
      memoryEnabled?: boolean
      autoMemoryEnabled?: boolean
      now?: Date
    }) {
      const now = input.now ?? new Date()
      const [record] = await database.insert(ownerChatCompanions).values({
        name: input.name,
        description: input.description ?? '',
        systemPrompt: input.systemPrompt,
        memoryEnabled: input.memoryEnabled ?? true,
        autoMemoryEnabled: input.autoMemoryEnabled ?? true,
        createdAt: now,
        updatedAt: now,
      }).returning()
      if (!record) throw new Error('Companion insert did not return a row')
      return record
    },

    listCompanions() {
      return database.select().from(ownerChatCompanions).orderBy(asc(ownerChatCompanions.createdAt))
    },

    async updateCompanion(input: {
      id: string; name: string; description: string; systemPrompt: string
      memoryEnabled: boolean; autoMemoryEnabled: boolean; now?: Date
    }) {
      const [record] = await database.update(ownerChatCompanions).set({
        name: input.name,
        description: input.description,
        systemPrompt: input.systemPrompt,
        memoryEnabled: input.memoryEnabled,
        autoMemoryEnabled: input.autoMemoryEnabled,
        updatedAt: input.now ?? new Date(),
      }).where(eq(ownerChatCompanions.id, input.id)).returning()
      if (!record) throw new Error('Companion was not found')
      return record
    },

    async createThread(input: { companionId: string; title?: string; now?: Date }) {
      const now = input.now ?? new Date()
      const [record] = await database.insert(ownerChatThreads).values({
        companionId: input.companionId,
        title: input.title?.trim() || 'New conversation',
        createdAt: now,
        updatedAt: now,
      }).returning()
      if (!record) throw new Error('Thread insert did not return a row')
      return record
    },

    listThreads() {
      return database.select().from(ownerChatThreads).orderBy(desc(ownerChatThreads.updatedAt))
    },

    async appendMessage(input: {
      threadId: string
      role: 'user' | 'assistant'
      content: string
      promptTokens?: number
      completionTokens?: number
      autoMemoryEvents?: Array<{ ok: boolean; label: string; detail: string }>
      now?: Date
    }) {
      const now = input.now ?? new Date()
      const [message] = await database.transaction(async (transaction) => {
        const inserted = await transaction.insert(ownerChatMessages).values({
          threadId: input.threadId,
          role: input.role,
          content: input.content,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          autoMemoryEvents: input.autoMemoryEvents ?? [],
          createdAt: now,
        }).returning()
        await transaction.update(ownerChatThreads).set({ updatedAt: now }).where(eq(ownerChatThreads.id, input.threadId))
        return inserted
      })
      if (!message) throw new Error('Message insert did not return a row')
      return message
    },

    async getThread(id: string) {
      const [row] = await database.select({ thread: ownerChatThreads, companion: ownerChatCompanions })
        .from(ownerChatThreads)
        .innerJoin(ownerChatCompanions, eq(ownerChatThreads.companionId, ownerChatCompanions.id))
        .where(eq(ownerChatThreads.id, id)).limit(1)
      if (!row) return null
      const messages = await database.select().from(ownerChatMessages)
        .where(eq(ownerChatMessages.threadId, id)).orderBy(asc(ownerChatMessages.createdAt), asc(ownerChatMessages.id))
      return { ...row.thread, companion: row.companion, messages }
    },

    async createMemory(input: {
      title: string; summary: string; content: string; oneLine: string; domain: string; tags: string[]
      valence: number; arousal: number; importance: number; pinned: boolean; resolved: boolean
      visibility: 'public' | 'only' | 'except' | 'private'; visibleTo: string[]; excludeFrom: string[]
      createdByCompanionId?: string | null; createdByName?: string | null; now?: Date
    }) {
      const now = input.now ?? new Date()
      const [record] = await database.insert(ownerMemories).values({
        ...input,
        createdByCompanionId: input.createdByCompanionId ?? null,
        createdByName: input.createdByName ?? null,
        createdAt: now,
        updatedAt: now,
        lastActivatedAt: now,
      }).returning()
      if (!record) throw new Error('Memory insert did not return a row')
      return toMemory(record)
    },

    async getMemory(id: string) {
      const [record] = await database.select().from(ownerMemories).where(eq(ownerMemories.id, id)).limit(1)
      return record ? toMemory(record) : null
    },

    async updateMemory(input: OwnerMemoryRecord & { now?: Date }) {
      const [record] = await database.update(ownerMemories).set({
        title: input.title,
        summary: input.summary,
        content: input.content,
        oneLine: input.oneLine,
        domain: input.domain,
        tags: input.tags,
        valence: input.valence,
        arousal: input.arousal,
        importance: input.importance,
        pinned: input.pinned,
        resolved: input.resolved,
        visibility: input.visibility,
        visibleTo: input.visibleTo,
        excludeFrom: input.excludeFrom,
        updatedAt: input.now ?? new Date(),
      }).where(eq(ownerMemories.id, input.id)).returning()
      if (!record) throw new Error('Memory was not found')
      return toMemory(record)
    },

    async deleteMemory(id: string) {
      await database.delete(ownerMemories).where(eq(ownerMemories.id, id))
    },

    async listMemories(input: { companionId?: string; now?: Date } = {}) {
      const records = (await database.select().from(ownerMemories)).map(toMemory)
      return records
        .filter((record) => input.companionId ? isMemoryVisibleTo(record, input.companionId) : true)
        .toSorted((left, right) => Number(right.pinned) - Number(left.pinned)
          || calculateMemoryScore(right, input.now) - calculateMemoryScore(left, input.now)
          || right.createdAt.getTime() - left.createdAt.getTime())
    },

    async activateMemories(ids: string[], now = new Date()) {
      if (!ids.length) return
      await database.update(ownerMemories).set({
        activationCount: sql`${ownerMemories.activationCount} + 1`,
        lastActivatedAt: now,
        updatedAt: now,
      }).where(inArray(ownerMemories.id, ids))
    },

    async listAutoMemories(companionId: string, archived = false) {
      return database.select().from(ownerAutoMemories)
        .where(and(eq(ownerAutoMemories.companionId, companionId), eq(ownerAutoMemories.archived, archived)))
        .orderBy(asc(ownerAutoMemories.createdAt))
    },

    async updateAutoMemory(input: {
      id: string; companionId: string; content: string; priority: 'always' | 'normal' | 'low'; archived: boolean; now?: Date
    }) {
      const [record] = await database.update(ownerAutoMemories).set({
        content: input.content.slice(0, 600),
        priority: input.priority,
        archived: input.archived,
        updatedAt: input.now ?? new Date(),
      }).where(and(eq(ownerAutoMemories.id, input.id), eq(ownerAutoMemories.companionId, input.companionId))).returning()
      if (!record) throw new Error('Auto Memory was not found')
      return record
    },

    async deleteAutoMemory(id: string, companionId: string) {
      await database.delete(ownerAutoMemories).where(and(eq(ownerAutoMemories.id, id), eq(ownerAutoMemories.companionId, companionId)))
    },

    async applyAutoMemoryOperations(input: {
      companionId: string
      authorName: string
      operations: AutoMemoryOperation[]
      now?: Date
    }) {
      const now = input.now ?? new Date()
      return database.transaction(async (transaction) => {
        const [companion] = await transaction.select({ enabled: ownerChatCompanions.autoMemoryEnabled })
          .from(ownerChatCompanions).where(eq(ownerChatCompanions.id, input.companionId)).limit(1)
        if (!companion?.enabled) return []
        const results: Array<{ ok: boolean; label: string; detail: string }> = []
        for (let index = 0; index < input.operations.length; index += 1) {
          const operation = input.operations[index]!
          if (index >= 3) {
            results.push({ ok: false, label: '已跳过多余的记忆操作', detail: `每轮最多 3 次（第 ${index + 1} 次被忽略）` })
            continue
          }
          if (operation.kind === 'create') {
            const category = AUTO_CATEGORIES.has(operation.category ?? '') ? operation.category! : 'personal_context'
            const priority = AUTO_PRIORITIES.has(operation.priority ?? '') ? operation.priority! as 'always' | 'normal' | 'low' : 'normal'
            const content = operation.content.slice(0, 600)
            if (!content) { results.push({ ok: false, label: '记忆写入失败', detail: '内容为空' }); continue }
            if (priority === 'always') {
              const [{ count }] = await transaction.select({ count: sql<number>`count(*)` }).from(ownerAutoMemories)
                .where(and(eq(ownerAutoMemories.companionId, input.companionId), eq(ownerAutoMemories.priority, 'always'), eq(ownerAutoMemories.archived, false)))
              if (Number(count) >= 3) { results.push({ ok: false, label: '记忆写入失败', detail: 'always 条目已达 3 条上限' }); continue }
            }
            await transaction.insert(ownerAutoMemories).values({ companionId: input.companionId, category, priority, content, updatedBy: input.authorName, createdAt: now, updatedAt: now })
            results.push({ ok: true, label: `已写入记忆 · ${category}`, detail: content })
          } else if (operation.kind === 'update') {
            const content = operation.content.slice(0, 600)
            const [existing] = operation.id ? await transaction.select().from(ownerAutoMemories)
              .where(and(eq(ownerAutoMemories.id, operation.id), eq(ownerAutoMemories.companionId, input.companionId))).limit(1) : []
            if (!existing || !content) { results.push({ ok: false, label: '记忆更新失败', detail: '未找到条目或内容为空' }); continue }
            await transaction.update(ownerAutoMemories).set({ content, updatedAt: now, updatedBy: input.authorName }).where(eq(ownerAutoMemories.id, existing.id))
            results.push({ ok: true, label: `已更新记忆 · ${existing.category}`, detail: content })
          } else {
            const [existing] = operation.id ? await transaction.select().from(ownerAutoMemories)
              .where(and(eq(ownerAutoMemories.id, operation.id), eq(ownerAutoMemories.companionId, input.companionId))).limit(1) : []
            if (!existing) { results.push({ ok: false, label: '记忆删除失败', detail: '未找到条目' }); continue }
            await transaction.delete(ownerAutoMemories).where(eq(ownerAutoMemories.id, existing.id))
            results.push({ ok: true, label: `已删除记忆 · ${existing.category}`, detail: existing.content })
          }
        }
        return results
      })
    },
  }
}
