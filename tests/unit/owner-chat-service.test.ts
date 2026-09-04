import { describe, expect, it, vi } from 'vitest'

import type { AiMessage } from '@/modules/ai/provider'
import { createOwnerChatService } from '@/modules/owner-chat/service'
import type { OwnerMemoryRecord } from '@/modules/owner-memory/contracts'

const now = new Date('2026-09-05T02:00:00.000Z')
const companion = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Nightingale', description: '夜间同行者', systemPrompt: '保持诚实与克制。', enabled: true,
  memoryEnabled: true, autoMemoryEnabled: true, autoMemoryMode: 'hybrid', autoMemoryBudget: 1_200,
}
const memory: OwnerMemoryRecord = {
  id: '22222222-2222-4222-8222-222222222222', title: '蓝色偏好', summary: '', content: '喜欢深蓝色。', oneLine: '',
  domain: '日常', tags: ['蓝色'], valence: 0.7, arousal: 0.3, importance: 8, pinned: true, resolved: false,
  visibility: 'public', visibleTo: [], excludeFrom: [], activationCount: 0, createdAt: now, lastActivatedAt: now,
  createdByCompanionId: null, createdByName: null,
}

describe('Owner Chat service', () => {
  it('injects source Memory and Auto Memory, strips operations, and persists the private exchange', async () => {
    const appended: Array<{ role: string; content: string }> = []
    const providerMessages: AiMessage[][] = []
    const applyOperations = vi.fn(async () => [{ ok: true, label: '已写入记忆', detail: '喜欢雨声' }])
    const activateMemories = vi.fn(async () => undefined)
    const quotaComplete = vi.fn(async () => undefined)
    const service = createOwnerChatService({
      repository: {
        async getThread() {
          return { id: '33333333-3333-4333-8333-333333333333', title: '雨夜', archived: false, companion, messages: [] }
        },
        async listMemories() { return [memory] },
        async listAutoMemories() {
          return [{ id: 'auto-1', companionId: companion.id, category: 'user_instructions', priority: 'always' as const, content: '回答保持简洁。', archived: false, updatedBy: 'Nightingale', createdAt: now, updatedAt: now }]
        },
        activateMemories,
        applyAutoMemoryOperations: applyOperations,
        async appendMessage(input) { appended.push({ role: input.role, content: input.content }); return { id: `${input.role}-id` } },
      },
      quota: {
        async reserve(input) { expect(input).toMatchObject({ feature: 'chat', sourceHash: 'owner-id', sessionId: '33333333-3333-4333-8333-333333333333' }); return { id: 'reservation' } },
        complete: quotaComplete,
        async fail() { throw new Error('unexpected quota failure') },
      },
      provider: {
        async complete(messages) {
          providerMessages.push(messages)
          return { content: '我记住了雨声。\n<mem_create category="personal_context" priority="normal">喜欢雨声。</mem_create>', truncated: false, providerRequestId: 'request-1', promptTokens: 120, completionTokens: 30 }
        },
      },
      providerName: 'openai-compatible', model: 'model', maxOutputTokens: 1_000,
      dailyBudgetMicroUsd: 100_000, inputMicroUsdPerMillionTokens: 200_000, outputMicroUsdPerMillionTokens: 800_000,
    })

    const result = await service.send({ ownerId: 'owner-id', threadId: '33333333-3333-4333-8333-333333333333', content: '今天下雨。', now })

    expect(providerMessages[0]?.[0]?.content).toContain('保持诚实与克制')
    expect(providerMessages[0]?.map((message) => message.content).join('\n')).toContain('蓝色偏好')
    expect(providerMessages[0]?.map((message) => message.content).join('\n')).toContain('回答保持简洁')
    expect(appended).toEqual([
      { role: 'user', content: '今天下雨。' },
      { role: 'assistant', content: '我记住了雨声。\n' },
    ])
    expect(result.content).toBe('我记住了雨声。\n')
    expect(result.autoMemoryEvents).toHaveLength(1)
    expect(activateMemories).toHaveBeenCalledWith([memory.id], expect.any(Date))
    expect(applyOperations).toHaveBeenCalledOnce()
    expect(quotaComplete).toHaveBeenCalledOnce()
  })

  it('refuses archived threads before reserving cost or storing a message', async () => {
    const reserve = vi.fn()
    const appendMessage = vi.fn()
    const service = createOwnerChatService({
      repository: {
        async getThread() { return { id: 'thread', title: 'old', archived: true, companion, messages: [] } },
        async listMemories() { return [] }, async listAutoMemories() { return [] },
        async activateMemories() {}, async applyAutoMemoryOperations() { return [] }, appendMessage,
      },
      quota: { reserve, async complete() {}, async fail() {} },
      provider: { async complete() { throw new Error('unreachable') } },
      providerName: 'provider', model: 'model', maxOutputTokens: 1_000,
      dailyBudgetMicroUsd: 100_000, inputMicroUsdPerMillionTokens: 1, outputMicroUsdPerMillionTokens: 1,
    })

    await expect(service.send({ ownerId: 'owner', threadId: 'thread', content: 'hello', now })).rejects.toThrow('archived')
    expect(reserve).not.toHaveBeenCalled()
    expect(appendMessage).not.toHaveBeenCalled()
  })
})
