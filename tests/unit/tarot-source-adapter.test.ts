import { describe, expect, it } from 'vitest'

import { createTarotFollowupPayload, createTarotReadingPayload, tarotCardIdFromSource } from '@/modules/tarot/source-adapter'

describe('Tarot immutable-source adapter', () => {
  it('maps source card objects to stable server card identifiers', () => {
    expect(tarotCardIdFromSource({ type: 'major', mi: 17 })).toBe('major:17')
    expect(tarotCardIdFromSource({ type: 'minor', suit: { en: 'Cups' }, rank: { num: 'Q' } })).toBe('Cups:Q')
  })

  it('builds a reading request from source slots without forwarding the browser prompt', () => {
    expect(createTarotReadingPayload({
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17', spread: 'single', guide: true,
      slots: [
        { card: { type: 'major', mi: 11 }, reversed: false },
        { card: { type: 'minor', suit: { en: 'Wands' }, rank: { num: 'A' } }, reversed: true },
      ],
    })).toEqual({
      mode: 'reading', sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      spread: 'single', guide: true,
      cards: [{ cardId: 'major:11', reversed: false }, { cardId: 'Wands:A', reversed: true }],
    })
  })

  it('builds a bounded follow-up request from the chained reading snapshot', () => {
    expect(createTarotFollowupPayload({
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17', spread: 'single', guide: false,
      cards: [{ cardId: 'major:11', reversed: false }], followupIndex: 0,
      followupGrant: 'a'.repeat(64), history: [{ role: 'assistant', content: '初次解读。' }],
      question: '请更详细地解读。',
    })).toMatchObject({ mode: 'followup', followupIndex: 0, question: '请更详细地解读。' })
  })
})
