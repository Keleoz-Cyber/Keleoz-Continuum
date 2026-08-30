import { describe, expect, it } from 'vitest'

import { createTarotFollowupGrantManager } from '@/modules/tarot/followup-grant'

const binding = {
  sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17', spread: 'single', guide: false,
  cards: [{ cardId: 'major:11', reversed: false }], followupIndex: 0,
  history: [{ role: 'assistant', content: '初次解读。' }],
}

describe('Tarot follow-up grant', () => {
  it('authorizes one bounded question against the exact reading history', () => {
    const manager = createTarotFollowupGrantManager('0123456789abcdef0123456789abcdef')
    const now = new Date('2026-08-30T01:00:00Z')
    const grant = manager.issue(binding, now)
    expect(manager.consume({ ...binding, question: '请详细解释。', followupGrant: grant }, now)).toBe(true)
    expect(manager.consume({ ...binding, question: '重放', followupGrant: grant }, now)).toBe(false)
  })

  it('rejects altered history and follow-up index', () => {
    const now = new Date('2026-08-30T01:00:00Z')
    const altered = createTarotFollowupGrantManager('0123456789abcdef0123456789abcdef')
    const grant = altered.issue(binding, now)
    expect(altered.consume({ ...binding, history: [{ role: 'assistant', content: '伪造' }], question: '继续', followupGrant: grant }, now)).toBe(false)
    const wrongIndex = createTarotFollowupGrantManager('0123456789abcdef0123456789abcdef')
    const grant2 = wrongIndex.issue(binding, now)
    expect(wrongIndex.consume({ ...binding, followupIndex: 1, question: '继续', followupGrant: grant2 }, now)).toBe(false)
  })
})
