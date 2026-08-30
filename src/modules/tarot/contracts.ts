import { z } from 'zod'

import type { AiMessage } from '@/modules/ai/provider'

const majors = [
  ['0', '愚者', 'The Fool'], ['I', '魔术师', 'The Magician'], ['II', '女祭司', 'The High Priestess'],
  ['III', '皇后', 'The Empress'], ['IV', '皇帝', 'The Emperor'], ['V', '教皇', 'The Hierophant'],
  ['VI', '恋人', 'The Lovers'], ['VII', '战车', 'The Chariot'], ['VIII', '力量', 'Strength'],
  ['IX', '隐者', 'The Hermit'], ['X', '命运之轮', 'Wheel of Fortune'], ['XI', '正义', 'Justice'],
  ['XII', '倒吊人', 'The Hanged Man'], ['XIII', '死神', 'Death'], ['XIV', '节制', 'Temperance'],
  ['XV', '恶魔', 'The Devil'], ['XVI', '塔', 'The Tower'], ['XVII', '星星', 'The Star'],
  ['XVIII', '月亮', 'The Moon'], ['XIX', '太阳', 'The Sun'], ['XX', '审判', 'Judgement'],
  ['XXI', '世界', 'The World'],
] as const
const suits = [
  { en: 'Wands', cn: '权杖', color: '#5a1a1a' },
  { en: 'Cups', cn: '圣杯', color: '#1a2a5a' },
  { en: 'Swords', cn: '宝剑', color: '#2a2a3a' },
  { en: 'Pentacles', cn: '星币', color: '#4a3a0a' },
] as const
const ranks = [
  { en: 'Ace', cn: '', num: 'A' }, { en: 'Two', cn: '二', num: '2' },
  { en: 'Three', cn: '三', num: '3' }, { en: 'Four', cn: '四', num: '4' },
  { en: 'Five', cn: '五', num: '5' }, { en: 'Six', cn: '六', num: '6' },
  { en: 'Seven', cn: '七', num: '7' }, { en: 'Eight', cn: '八', num: '8' },
  { en: 'Nine', cn: '九', num: '9' }, { en: 'Ten', cn: '十', num: '10' },
  { en: 'Page', cn: '侍从', num: 'P' }, { en: 'Knight', cn: '骑士', num: 'Kn' },
  { en: 'Queen', cn: '王后', num: 'Q' }, { en: 'King', cn: '国王', num: 'K' },
] as const

export type TarotCard = {
  id: string
  type: 'major' | 'minor'
  display: string
  num: string
  cn: string
  en: string
  suit?: string
  color: string
}

export const TAROT_DECK: TarotCard[] = [
  ...majors.map(([num, cn, en], index) => ({
    id: `major:${index}`, type: 'major' as const, num, cn, en,
    display: `${num} - ${cn} ${en}`, color: '#2a1540',
  })),
  ...suits.flatMap((suit) => ranks.map((rank) => ({
    id: `${suit.en}:${rank.num}`, type: 'minor' as const, num: rank.num,
    cn: `${suit.cn}${rank.cn || rank.en}`, en: `${rank.en} of ${suit.en}`, suit: suit.en,
    display: `${suit.cn}${rank.cn || rank.en} ${rank.en} of ${suit.en}`, color: suit.color,
  }))),
]
const cardById = new Map(TAROT_DECK.map((card) => [card.id, card]))

export const TAROT_SPREADS = [
  { id: 'free', name: '无牌阵', nameEn: 'Free', desc: '自由抽牌', maxCards: 3, slots: [] },
  { id: 'single', name: '单牌', nameEn: 'Single', desc: '此刻的指引', slots: ['此刻'] },
  { id: 'timeline', name: '时间之流', nameEn: 'Timeline', desc: '过去 · 现在 · 未来', slots: ['过去', '现在', '未来'] },
  { id: 'cross', name: '十字', nameEn: 'Cross', desc: '处境 · 障碍 · 建议 · 结果', slots: ['处境', '障碍', '建议', '结果'] },
  { id: 'star', name: '命运之星', nameEn: 'Star', desc: '现状 · 挑战 · 根源 · 未来 · 潜力', slots: ['现状', '挑战', '根源', '未来', '潜力'] },
] as const
export type TarotSpreadId = (typeof TAROT_SPREADS)[number]['id']

const tarotCardSchema = z.object({
  cardId: z.string().refine((id) => cardById.has(id), 'Unknown Tarot card'),
  reversed: z.boolean(),
}).strict()
const sharedShape = {
  sessionId: z.uuid(), spread: z.enum(['free', 'single', 'timeline', 'cross', 'star']),
  guide: z.boolean(), cards: z.array(tarotCardSchema).min(1).max(6),
}
const historyMessage = z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2_000) }).strict()

export const tarotGatewayRequestSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('reading'), ...sharedShape }).strict(),
  z.object({
    mode: z.literal('followup'), ...sharedShape,
    followupIndex: z.number().int().min(0).max(2),
    followupGrant: z.string().min(32).max(256).regex(/^[A-Za-z0-9._-]+$/),
    history: z.array(historyMessage).min(1).max(7),
    question: z.string().trim().min(1).max(500),
  }).strict(),
]).superRefine((value, context) => {
  if (new Set(value.cards.map((card) => card.cardId)).size !== value.cards.length) {
    context.addIssue({ code: 'custom', path: ['cards'], message: 'Tarot cards must be unique' })
  }
  const spread = TAROT_SPREADS.find((item) => item.id === value.spread)!
  const expected = value.spread === 'free' ? null : spread.slots.length + (value.guide ? 1 : 0)
  const freeMax = 3 + (value.guide ? 1 : 0)
  const valid = expected === null
    ? value.cards.length >= 1 + (value.guide ? 1 : 0) && value.cards.length <= freeMax
    : value.cards.length === expected
  if (!valid) context.addIssue({ code: 'custom', path: ['cards'], message: 'Card count does not match Tarot spread' })
})

export type TarotGatewayRequest = z.infer<typeof tarotGatewayRequestSchema>

export function tarotCard(cardId: string) {
  return cardById.get(cardId) ?? null
}

function spreadLabels(input: Pick<TarotGatewayRequest, 'spread' | 'guide' | 'cards'>) {
  const spread = TAROT_SPREADS.find((item) => item.id === input.spread)!
  const labels = input.spread === 'free'
    ? input.cards.map((_, index) => `第${index + 1}张`)
    : [...spread.slots]
  if (input.guide) labels.push('指引')
  return { spread, labels }
}

export function buildTarotReadingMessages(
  input: Pick<TarotGatewayRequest, 'spread' | 'guide' | 'cards'>,
): AiMessage[] {
  const { spread, labels } = spreadLabels(input)
  const cards = input.cards.map((draw, index) => {
    const card = tarotCard(draw.cardId)!
    return `${labels[index]}：${card.display}（${draw.reversed ? '逆位' : '正位'}）`
  }).join('\n')
  const spreadName = `${spread.name}${input.guide ? ' + 指引牌' : ''}`
  return [
    { role: 'system', content: '你是一位塔罗占卜师。请为你眼前的至亲之人来解读塔罗牌。\n你的解读风格客观、诚实，又不失亲和力。' },
    { role: 'user', content: `用户使用「${spreadName}」牌阵进行了塔罗占卜：\n${cards}\n\n请综合这${input.cards.length}张牌的位置含义和正逆位，给出占卜解读。使用中文，200字以内。` },
  ]
}

export function buildTarotProviderMessages(input: TarotGatewayRequest): AiMessage[] {
  const base = buildTarotReadingMessages(input)
  return input.mode === 'reading'
    ? base
    : [...base, ...input.history, { role: 'user', content: input.question }]
}
