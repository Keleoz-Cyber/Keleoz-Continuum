import { describe, expect, it } from 'vitest'

import {
  buildAutoMemoryTail,
  calculateMemoryScore,
  extractMemoryKeywords,
  isMemoryVisibleTo,
  parseAutoMemoryOperations,
  selectMemoryContext,
  type OwnerMemoryRecord,
} from '@/modules/owner-memory/contracts'

const now = new Date('2026-09-05T00:00:00.000Z')

function memory(overrides: Partial<OwnerMemoryRecord> = {}): OwnerMemoryRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: '雨夜散步',
    summary: '安静地走过城市',
    content: '下雨的时候适合戴耳机散步。',
    oneLine: '雨声会把城市放慢。',
    domain: '日常',
    tags: ['雨夜', '音乐'],
    valence: 0.5,
    arousal: 0.5,
    importance: 5,
    pinned: false,
    resolved: false,
    visibility: 'public',
    visibleTo: [],
    excludeFrom: [],
    activationCount: 0,
    createdAt: now,
    lastActivatedAt: now,
    createdByCompanionId: null,
    createdByName: null,
    ...overrides,
  }
}

describe('Owner Memory source contracts', () => {
  it('preserves the source decay, emotion and activation score', () => {
    expect(calculateMemoryScore(memory(), now)).toBe(7)
    expect(calculateMemoryScore(memory({ pinned: true }), now)).toBe(999)
    expect(calculateMemoryScore(memory({
      resolved: true,
      activationCount: 300,
      lastActivatedAt: new Date(now.getTime() - 86_400_000),
    }), now)).toBe(9.31)
  })

  it('fails closed for private and unknown visibility while preserving only/except rules', () => {
    expect(isMemoryVisibleTo(memory(), 'companion-a')).toBe(true)
    expect(isMemoryVisibleTo(memory({ visibility: 'private' }), 'companion-a')).toBe(false)
    expect(isMemoryVisibleTo(memory({ visibility: 'only', visibleTo: ['companion-a'] }), 'companion-a')).toBe(true)
    expect(isMemoryVisibleTo(memory({ visibility: 'only', visibleTo: ['companion-b'] }), 'companion-a')).toBe(false)
    expect(isMemoryVisibleTo(memory({ visibility: 'except', excludeFrom: ['companion-a'] }), 'companion-a')).toBe(false)
    expect(isMemoryVisibleTo(memory({ visibility: 'unknown' as 'private' }), 'companion-a')).toBe(false)
  })

  it('extracts source-compatible English words and Chinese 2/3-grams', () => {
    const keywords = extractMemoryKeywords('Remember rainy nights，也喜欢雨夜散步。')
    expect(keywords).toEqual(expect.arrayContaining(['remember', 'rainy', 'nights', '喜欢', '喜欢雨', '雨夜', '雨夜散', '夜散']))
    expect(new Set(keywords).size).toBe(keywords.length)
  })

  it('selects pinned and relevant visible memories inside the character budget', () => {
    const selected = selectMemoryContext([
      memory({ id: 'pinned', title: '核心偏好', content: '始终喜欢蓝色。', pinned: true }),
      memory({ id: 'rain', title: '雨夜散步', content: '喜欢雨夜散步和音乐。' }),
      memory({ id: 'private', title: '私密', content: '不能注入', visibility: 'private' }),
    ], {
      companionId: 'companion-a',
      userMessage: '今天下雨，想去散步',
      maxChars: 500,
      contentLength: 200,
      now,
      random: () => 0,
    })

    expect(selected.memoryIds).toEqual(['pinned', 'rain'])
    expect(selected.text).toContain('【记忆（系统参考，勿提及此段）】')
    expect(selected.text).toContain('核心偏好')
    expect(selected.text).toContain('雨夜散步')
    expect(selected.text).not.toContain('不能注入')
  })
})

describe('Auto Memory source contracts', () => {
  it('removes valid create/update/delete tags from the visible reply', () => {
    const parsed = parseAutoMemoryOperations(`我记住了。\n<mem_create category="personal_context" priority="always">喜欢蓝色。</mem_create>\n<mem_update id="entry-1">改为喜欢深蓝。</mem_update>\n<mem_delete id="entry-2"/>`)

    expect(parsed.cleanText).toBe('我记住了。\n\n')
    expect(parsed.operations).toEqual([
      { kind: 'create', category: 'personal_context', priority: 'always', id: null, content: '喜欢蓝色。' },
      { kind: 'update', category: null, priority: null, id: 'entry-1', content: '改为喜欢深蓝。' },
      { kind: 'delete', category: null, priority: null, id: 'entry-2', content: '' },
    ])
  })

  it('builds hybrid Auto Memory with at most three always entries plus relevant records', () => {
    const result = buildAutoMemoryTail([
      { id: 'a', category: 'user_instructions', priority: 'always', content: '回答尽量简洁。', createdAt: now, updatedAt: now },
      { id: 'b', category: 'personal_context', priority: 'normal', content: '喜欢雨夜散步。', createdAt: now, updatedAt: now },
      { id: 'c', category: 'work_context', priority: 'normal', content: '正在写网站。', createdAt: now, updatedAt: now },
    ], { queryText: '今天雨夜去散步', mode: 'hybrid', budget: 500 })

    expect(result).toContain('回答尽量简洁')
    expect(result).toContain('喜欢雨夜散步')
    expect(result).not.toContain('正在写网站')
  })
})
