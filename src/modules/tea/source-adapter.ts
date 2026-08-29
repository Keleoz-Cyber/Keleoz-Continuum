import { saveTeaHistoryRecord } from './local-history-browser'

const drinkIds = new Set(['black', 'green', 'floral', 'coffee', 'milk'])
const dessertIds = new Set(['strawberry', 'vanilla', 'blueberry', 'matcha', 'tiramisu'])
const sessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SourceMessage = { role?: unknown; content?: unknown }

export function createTeaGatewayPayload(input: {
  sessionId: string
  drink: string | null
  dessert: string | null
  isNight: boolean
  messages: SourceMessage[]
}) {
  if (!sessionPattern.test(input.sessionId)) return null
  if (!input.drink || !drinkIds.has(input.drink)) return null
  if (!input.dessert || !dessertIds.has(input.dessert)) return null

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const message of input.messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue
    if (typeof message.content !== 'string') return null
    const content = message.content.trim()
    if (!content || content.length > 1_000) return null
    messages.push({ role: message.role, content })
  }
  const boundedMessages = messages.slice(-32)
  if (!boundedMessages.length) return null
  if (boundedMessages.reduce((total, message) => total + message.content.length, 0) > 12_000) return null

  return {
    sessionId: input.sessionId,
    drink: input.drink,
    dessert: input.dessert,
    isNight: input.isNight,
    messages: boundedMessages,
  }
}

export function installTeaSourceAdapter(options: { companionName: string }) {
  const sourceWindow = window as unknown as Window & Record<string, unknown>
  const globalNames = [
    'apiConfigs',
    'loadApiConfigs',
    'callApiChat',
    'dbGet',
    'dbGetAll',
    'dbPut',
    'ensureDiaryInit',
  ] as const
  const previousDescriptors = new Map<string, PropertyDescriptor | undefined>(
    globalNames.map((name) => [name, Object.getOwnPropertyDescriptor(sourceWindow, name)]),
  )
  let activeFeature: 'tea' | 'story' | 'tarot' | 'other' | null = null
  let teaSessionId: string | null = null
  const companion = {
    id: 'continuum-site-companion',
    nickname: options.companionName,
    model: 'site-companion',
    relationship: '站点访客与数字空间主人',
    streaming: false,
  }

  const identifyInteraction = (event: Event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-action], .ix-marker[data-id]')
      : null
    const action = target?.dataset.action ?? target?.dataset.id
    if (!action) return
    activeFeature = action === 'tea'
      ? 'tea'
      : action === 'desk'
        ? 'story'
        : action === 'crystal'
          ? 'tarot'
          : 'other'
  }
  document.addEventListener('click', identifyInteraction, true)

  Object.defineProperty(sourceWindow, 'apiConfigs', {
    configurable: true,
    get: () => activeFeature === 'tea' ? [companion] : [],
  })
  Object.defineProperty(sourceWindow, 'loadApiConfigs', { configurable: true, value: () => undefined })
  Object.defineProperty(sourceWindow, 'callApiChat', {
    configurable: true,
    value: async (_config: unknown, messages: SourceMessage[]) => {
      const game = sourceWindow.G as {
        teaDrink?: string | null
        teaDessert?: string | null
        teaRound?: number
      } | undefined
      if (activeFeature !== 'tea' || !game) throw new Error('该互动尚未开放。')
      const eligibleMessages = messages.filter((message) => message.role === 'user' || message.role === 'assistant')
      if (!teaSessionId || (game.teaRound === 0 && eligibleMessages.length <= 1)) {
        teaSessionId = crypto.randomUUID()
      }
      const payload = createTeaGatewayPayload({
        sessionId: teaSessionId,
        drink: game.teaDrink ?? null,
        dessert: game.teaDessert ?? null,
        isNight: document.body.classList.contains('theme-infernal'),
        messages,
      })
      if (!payload) throw new Error('Tea 请求内容不符合要求。')

      const response = await fetch('/api/ai/tea', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body: unknown = await response.json().catch(() => null)
      const result = body && typeof body === 'object' ? body as Record<string, unknown> : {}
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Tea AI 暂时没有回应。')
      if (typeof result.content !== 'string' || !result.content.trim()) throw new Error('Tea AI 返回了无效内容。')
      return result.content.trim()
    },
  })
  Object.defineProperty(sourceWindow, 'dbGet', {
    configurable: true,
    value: async (store: string, key: string) => store === 'about' && key === 'main'
      ? { name: 'Visitor', bio: '' }
      : null,
  })
  Object.defineProperty(sourceWindow, 'dbGetAll', { configurable: true, value: async () => [] })
  Object.defineProperty(sourceWindow, 'dbPut', {
    configurable: true,
    value: async (store: string, value: unknown) => {
      if (store !== 'posts') throw new Error('Unsupported local store')
      await saveTeaHistoryRecord(value)
    },
  })
  Object.defineProperty(sourceWindow, 'ensureDiaryInit', { configurable: true, value: async () => undefined })

  return () => {
    document.removeEventListener('click', identifyInteraction, true)
    for (const [name, descriptor] of previousDescriptors) {
      if (descriptor) Object.defineProperty(sourceWindow, name, descriptor)
      else delete sourceWindow[name]
    }
  }
}
