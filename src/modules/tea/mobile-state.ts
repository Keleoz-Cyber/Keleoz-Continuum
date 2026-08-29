import { TEA_DESSERTS, TEA_DRINKS, type TeaDessertId, type TeaDrinkId } from './contracts'

export type MobileTeaMessage = {
  role: 'user' | 'assistant'
  content: string
  visible?: false
}

export type MobileTeaState = {
  sessionId: string
  step: 'select' | 'chat'
  drink: TeaDrinkId | null
  dessert: TeaDessertId | null
  round: number
  transcriptRevision: number
  messages: MobileTeaMessage[]
}

export function createMobileTeaState(sessionId: string): MobileTeaState {
  return {
    sessionId,
    step: 'select',
    drink: null,
    dessert: null,
    round: 0,
    transcriptRevision: 0,
    messages: [],
  }
}

export function mobileTeaVisitorRoundLimit(maxRequestsPerSession: number) {
  const requestLimit = Math.max(0, Math.floor(maxRequestsPerSession))
  if (requestLimit < 7) return Math.max(0, requestLimit - 1)
  return Math.min(15, requestLimit - 2)
}

export function findNearestMobileTeaSelection(x: number, y: number):
  | { kind: 'drink'; id: TeaDrinkId }
  | { kind: 'dessert'; id: TeaDessertId }
  | null {
  const candidates = [
    ...TEA_DRINKS.map((item) => ({ kind: 'drink' as const, item })),
    ...TEA_DESSERTS.map((item) => ({ kind: 'dessert' as const, item })),
  ]
  let nearest: (typeof candidates)[number] | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    const { hotspot } = candidate.item
    const dx = Math.max(hotspot.x - x, 0, x - hotspot.x - hotspot.width)
    const dy = Math.max(hotspot.y - y, 0, y - hotspot.y - hotspot.height)
    const distance = Math.hypot(dx, dy)
    if (distance < nearestDistance) {
      nearest = candidate
      nearestDistance = distance
    }
  }

  if (!nearest || nearestDistance > 22) return null
  return { kind: nearest.kind, id: nearest.item.id } as
    | { kind: 'drink'; id: TeaDrinkId }
    | { kind: 'dessert'; id: TeaDessertId }
}

export function selectMobileTeaItem(
  state: MobileTeaState,
  selection: { kind: 'drink'; id: TeaDrinkId } | { kind: 'dessert'; id: TeaDessertId },
): MobileTeaState {
  return selection.kind === 'drink'
    ? { ...state, drink: selection.id }
    : { ...state, dessert: selection.id }
}

export function startMobileTeaChat(state: MobileTeaState): MobileTeaState {
  return state.drink && state.dessert ? { ...state, step: 'chat' } : state
}

export function appendMobileTeaMessage(state: MobileTeaState, message: MobileTeaMessage): MobileTeaState {
  return {
    ...state,
    round: state.round + (message.role === 'user' ? 1 : 0),
    transcriptRevision: state.transcriptRevision + 1,
    messages: [...state.messages, message],
  }
}

export function appendMobileTeaDeparture(state: MobileTeaState): MobileTeaState {
  return {
    ...state,
    transcriptRevision: state.transcriptRevision + 1,
    messages: [...state.messages, {
      role: 'user',
      content: '[对方准备离开了]',
      visible: false,
    }],
  }
}

export function projectMobileTeaGatewayMessages(messages: MobileTeaMessage[]) {
  return messages.map(({ role, content }) => ({ role, content }))
}
