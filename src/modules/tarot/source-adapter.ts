import { tarotGatewayRequestSchema, type TarotGatewayRequest } from './contracts'

type SourceCard = { type?: unknown; mi?: unknown; suit?: { en?: unknown }; rank?: { num?: unknown } }
export function tarotCardIdFromSource(card: SourceCard) {
  if (card.type === 'major' && Number.isInteger(card.mi)) return `major:${card.mi}`
  if (card.type === 'minor' && typeof card.suit?.en === 'string' && typeof card.rank?.num === 'string') {
    return `${card.suit.en}:${card.rank.num}`
  }
  return null
}

export function createTarotReadingPayload(input: {
  sessionId: string
  spread: string
  guide: boolean
  slots: Array<{ card?: SourceCard; reversed?: unknown } | null>
}): TarotGatewayRequest | null {
  const cards = input.slots.filter((slot): slot is NonNullable<typeof slot> => Boolean(slot)).map((slot) => ({
    cardId: tarotCardIdFromSource(slot.card ?? {}), reversed: slot.reversed === true,
  }))
  if (cards.some((card) => !card.cardId)) return null
  const parsed = tarotGatewayRequestSchema.safeParse({
    mode: 'reading', sessionId: input.sessionId, spread: input.spread, guide: input.guide, cards,
  })
  return parsed.success ? parsed.data : null
}

export function createTarotFollowupPayload(input: {
  sessionId: string; spread: string; guide: boolean
  cards: Array<{ cardId: string; reversed: boolean }>
  followupIndex: number; followupGrant: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  question: string
}): TarotGatewayRequest | null {
  const parsed = tarotGatewayRequestSchema.safeParse({ mode: 'followup', ...input })
  return parsed.success ? parsed.data : null
}
