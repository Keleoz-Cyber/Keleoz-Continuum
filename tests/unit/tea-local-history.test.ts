import { describe, expect, it } from 'vitest'

import { normalizeTeaSourcePost } from '@/modules/tea/local-history'

const sourcePost = {
  id: 'tea_1777777',
  title: 'Tea · 绿茶 × 抹茶布丁',
  subtitle: 'Keleoz · 3 rounds',
  locked: true,
  category: '',
  content: '【茶歇记录】\n只存在当前浏览器。',
  created: 1_777_777,
  updated: 1_777_888,
}

describe('Tea local history record', () => {
  it('wraps the source Save payload in a versioned browser-only record', () => {
    expect(normalizeTeaSourcePost(sourcePost)).toEqual({
      id: 'tea-history:tea_1777777',
      type: 'tea-history',
      version: 1,
      title: sourcePost.title,
      subtitle: sourcePost.subtitle,
      content: sourcePost.content,
      createdAt: sourcePost.created,
      updatedAt: sourcePost.updated,
    })
  })

  it('rejects unrelated, unlocked, or oversized source posts', () => {
    expect(normalizeTeaSourcePost({ ...sourcePost, id: 'blog_1' })).toBeNull()
    expect(normalizeTeaSourcePost({ ...sourcePost, locked: false })).toBeNull()
    expect(normalizeTeaSourcePost({ ...sourcePost, content: 'x'.repeat(60_001) })).toBeNull()
  })
})
