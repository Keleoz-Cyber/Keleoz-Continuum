import { describe, expect, it } from 'vitest'

import { normalizeStorySourcePost } from '@/modules/story/local-history'

const sourceProgress = {
  id: 'post_1777777',
  title: '📖 Story 进度 — Keleoz',
  subtitle: '第3轮 · 进行中',
  locked: true,
  category: '',
  content: '【互动故事 · 进度存档】（第3轮，故事进行中）\n\n钟楼仍在下雨。',
  created: 1_777_777,
  updated: 1_777_888,
}

describe('Story local history record', () => {
  it('wraps source progress and final saves in one versioned browser-local namespace', () => {
    expect(normalizeStorySourcePost(sourceProgress)).toEqual({
      id: 'story-history:post_1777777',
      type: 'story-history',
      version: 1,
      stage: 'progress',
      title: sourceProgress.title,
      subtitle: sourceProgress.subtitle,
      content: sourceProgress.content,
      createdAt: sourceProgress.created,
      updatedAt: sourceProgress.updated,
    })
    expect(normalizeStorySourcePost({
      ...sourceProgress,
      title: '📜 Story Design — Keleoz',
      subtitle: 'Full Game Design Document · 14 Rounds',
      content: '## 游戏概要\n完整设定。',
    })).toMatchObject({ id: 'story-history:post_1777777', stage: 'document' })
    expect(normalizeStorySourcePost({
      ...sourceProgress,
      title: '📜 Story Design — Keleoz',
      subtitle: '设定文档生成中… · 14 Rounds',
      content: '（AI正在生成，以下是原始记录。）',
    })).toMatchObject({ id: 'story-history:post_1777777', stage: 'generating' })
    expect(normalizeStorySourcePost({
      ...sourceProgress,
      title: 'Interactive Story - Keleoz',
      subtitle: 'Round 14',
      content: '【互动故事记录】\n\n原始记录。',
    })).toMatchObject({ stage: 'raw' })
  })

  it('rejects unrelated posts, unlocked records, and oversized content', () => {
    expect(normalizeStorySourcePost({ ...sourceProgress, title: '普通密码日记' })).toBeNull()
    expect(normalizeStorySourcePost({ ...sourceProgress, locked: false })).toBeNull()
    expect(normalizeStorySourcePost({ ...sourceProgress, content: 'x'.repeat(120_001) })).toBeNull()
  })
})
