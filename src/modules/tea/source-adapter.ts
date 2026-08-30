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
