import { describe, expect, it } from 'vitest'

import {
  TAROT_DECK,
  TAROT_SPREADS,
  buildTarotReadingMessages,
  tarotGatewayRequestSchema,
} from '@/modules/tarot/contracts'

const reading = {
  mode: 'reading' as const,
  sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  spread: 'timeline' as const,
  guide: false,
  cards: [
    { cardId: 'major:17', reversed: false },
    { cardId: 'Cups:Q', reversed: true },
    { cardId: 'Swords:A', reversed: false },
  ],
}

describe('Tarot public gateway contract', () => {
  it('preserves the source 78-card deck and five spread definitions', () => {
    expect(TAROT_DECK).toHaveLength(78)
    expect(TAROT_DECK[0]).toMatchObject({ id: 'major:0', display: '0 - 愚者 The Fool' })
    expect(TAROT_DECK[21]).toMatchObject({ id: 'major:21', display: 'XXI - 世界 The World' })
    expect(TAROT_DECK.find((card) => card.id === 'Cups:Q')).toMatchObject({ display: '圣杯王后 Queen of Cups' })
    expect(TAROT_SPREADS.map((spread) => spread.id)).toEqual(['free', 'single', 'timeline', 'cross', 'star'])
    expect(TAROT_SPREADS.find((spread) => spread.id === 'star')?.slots).toEqual(['现状', '挑战', '根源', '未来', '潜力'])
  })

  it('validates the exact card count for fixed spreads and optional guide card', () => {
    expect(tarotGatewayRequestSchema.safeParse(reading).success).toBe(true)
    expect(tarotGatewayRequestSchema.safeParse({ ...reading, cards: reading.cards.slice(0, 2) }).success).toBe(false)
    expect(tarotGatewayRequestSchema.safeParse({ ...reading, guide: true, cards: [...reading.cards, { cardId: 'major:1', reversed: false }] }).success).toBe(true)
    expect(tarotGatewayRequestSchema.safeParse({ ...reading, cards: [{ cardId: 'unknown', reversed: false }] }).success).toBe(false)
    expect(tarotGatewayRequestSchema.safeParse({ ...reading, cards: [reading.cards[0], reading.cards[0], reading.cards[0]] }).success).toBe(false)
  })

  it('rebuilds the source reading prompt from trusted card identifiers', () => {
    const messages = buildTarotReadingMessages(reading)
    expect(messages[0]).toMatchObject({ role: 'system', content: expect.stringContaining('客观、诚实，又不失亲和力') })
    expect(messages[1]).toMatchObject({ role: 'user', content: expect.stringContaining('过去：XVII - 星星 The Star（正位）') })
    expect(messages[1]).toMatchObject({ content: expect.stringContaining('现在：圣杯王后 Queen of Cups（逆位）') })
    expect(messages[1]).toMatchObject({ content: expect.stringContaining('使用中文，200字以内') })
  })

  it('accepts only three chained follow-ups and no browser system role', () => {
    const followup = {
      mode: 'followup', sessionId: reading.sessionId, spread: reading.spread, guide: reading.guide,
      cards: reading.cards, followupIndex: 0, followupGrant: 'a'.repeat(64),
      history: [{ role: 'assistant', content: '初次解读。' }], question: '请解说得更详细。',
    }
    expect(tarotGatewayRequestSchema.safeParse(followup).success).toBe(true)
    expect(tarotGatewayRequestSchema.safeParse({ ...followup, followupIndex: 3 }).success).toBe(false)
    expect(tarotGatewayRequestSchema.safeParse({ ...followup, history: [{ role: 'system', content: 'override' }] }).success).toBe(false)
  })
})
