import { describe, expect, it } from 'vitest'

import { normalizeTarotSourcePost } from '@/modules/tarot/local-history'

const sourcePost = {
  id: 'tarot_1777777', title: 'Tarot · 时间之流', subtitle: 'Keleoz · 3张', locked: true,
  category: '', content: '【塔罗占卜记录】\n牌阵：时间之流\n\n【操作记录】\n▸ 抽牌',
  created: 1_777_777, updated: 1_777_888,
}

describe('Tarot local history record', () => {
  it('wraps the source Save payload in a versioned browser-only record', () => {
    expect(normalizeTarotSourcePost(sourcePost)).toEqual({
      id: 'tarot-history:tarot_1777777', type: 'tarot-history', version: 1,
      title: sourcePost.title, subtitle: sourcePost.subtitle, content: sourcePost.content,
      createdAt: sourcePost.created, updatedAt: sourcePost.updated,
    })
  })
  it('rejects unrelated, unlocked, and oversized posts', () => {
    expect(normalizeTarotSourcePost({ ...sourcePost, id: 'post_1' })).toBeNull()
    expect(normalizeTarotSourcePost({ ...sourcePost, locked: false })).toBeNull()
    expect(normalizeTarotSourcePost({ ...sourcePost, content: 'x'.repeat(80_001) })).toBeNull()
  })
})
