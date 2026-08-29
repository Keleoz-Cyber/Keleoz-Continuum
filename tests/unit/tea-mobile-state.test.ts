import { describe, expect, it } from 'vitest'

import {
  appendMobileTeaMessage,
  appendMobileTeaDeparture,
  createMobileTeaState,
  findNearestMobileTeaSelection,
  mobileTeaVisitorRoundLimit,
  projectMobileTeaGatewayMessages,
  selectMobileTeaItem,
  startMobileTeaChat,
} from '@/modules/tea/mobile-state'
import { TEA_DESSERTS, TEA_DRINKS, teaGatewayRequestSchema } from '@/modules/tea/contracts'

describe('Mobile Tea state', () => {
  it('requires one source drink and dessert before entering chat', () => {
    const initial = createMobileTeaState('9be2d91d-4b54-4f86-bf71-531476e38a17')
    const drink = selectMobileTeaItem(initial, { kind: 'drink', id: 'green' })
    const complete = selectMobileTeaItem(drink, { kind: 'dessert', id: 'matcha' })

    expect(startMobileTeaChat(drink).step).toBe('select')
    expect(startMobileTeaChat(complete)).toMatchObject({
      step: 'chat',
      drink: 'green',
      dessert: 'matcha',
      round: 0,
      transcriptRevision: 0,
    })
  })

  it('counts only visitor messages as source Tea rounds', () => {
    const selected = startMobileTeaChat(selectMobileTeaItem(
      selectMobileTeaItem(createMobileTeaState('9be2d91d-4b54-4f86-bf71-531476e38a17'), { kind: 'drink', id: 'green' }),
      { kind: 'dessert', id: 'matcha' },
    ))
    const assistant = appendMobileTeaMessage(selected, { role: 'assistant', content: '慢慢坐。' })
    const visitor = appendMobileTeaMessage(assistant, { role: 'user', content: '好。' })

    expect(assistant.round).toBe(0)
    expect(visitor.round).toBe(1)
    expect(assistant.transcriptRevision).toBe(1)
    expect(visitor.transcriptRevision).toBe(2)
    expect(visitor.messages).toEqual([
      { role: 'assistant', content: '慢慢坐。' },
      { role: 'user', content: '好。' },
    ])
  })

  it('reserves one gateway request for opening and one for the source Bye flow', () => {
    expect(mobileTeaVisitorRoundLimit(12)).toBe(10)
    expect(mobileTeaVisitorRoundLimit(7)).toBe(5)
    expect(mobileTeaVisitorRoundLimit(17)).toBe(15)
    expect(mobileTeaVisitorRoundLimit(52)).toBe(15)
    expect(mobileTeaVisitorRoundLimit(6)).toBe(5)
    expect(mobileTeaVisitorRoundLimit(2)).toBe(1)
    expect(mobileTeaVisitorRoundLimit(1)).toBe(0)
  })

  it('records the source departure marker without counting or displaying another visitor round', () => {
    const initial = appendMobileTeaMessage(createMobileTeaState('9be2d91d-4b54-4f86-bf71-531476e38a17'), {
      role: 'user',
      content: '先坐一会儿。',
    })
    const departed = appendMobileTeaDeparture(initial)

    expect(departed.round).toBe(1)
    expect(departed.transcriptRevision).toBe(2)
    expect(departed.messages.at(-1)).toEqual({
      role: 'user',
      content: '[对方准备离开了]',
      visible: false,
    })

    const gatewayMessages = projectMobileTeaGatewayMessages(departed.messages)
    expect(gatewayMessages.at(-1)).toEqual({ role: 'user', content: '[对方准备离开了]' })
    expect(teaGatewayRequestSchema.safeParse({
      sessionId: departed.sessionId,
      drink: 'green',
      dessert: 'matcha',
      isNight: false,
      messages: gatewayMessages,
    }).success).toBe(true)
  })

  it('maps each exact source hotspot center to one unambiguous Mobile selection', () => {
    for (const item of TEA_DRINKS) {
      expect(findNearestMobileTeaSelection(
        item.hotspot.x + item.hotspot.width / 2,
        item.hotspot.y + item.hotspot.height / 2,
      )).toEqual({ kind: 'drink', id: item.id })
    }
    for (const item of TEA_DESSERTS) {
      expect(findNearestMobileTeaSelection(
        item.hotspot.x + item.hotspot.width / 2,
        item.hotspot.y + item.hotspot.height / 2,
      )).toEqual({ kind: 'dessert', id: item.id })
    }
    expect(findNearestMobileTeaSelection(430, 570)).toBeNull()
  })
})
