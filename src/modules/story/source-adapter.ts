import {
  STORY_GENRES,
  STORY_HORROR_LEVELS,
  storyGatewayRequestSchema,
  type StoryGatewayRequest,
} from './contracts'

const genreIds = new Set<string>(STORY_GENRES)
const horrorIds = new Set<string>(STORY_HORROR_LEVELS)
const sessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SourceMessage = { role?: unknown; content?: unknown }

export function createStoryGatewayPayload(input: {
  mode: 'turn' | 'document'
  sessionId: string
  genre: string | null
  horror: string | null
  customScript: string | null
  messages: SourceMessage[]
  documentSoFar: string
  documentSegment?: number
  documentGrant?: string
}): StoryGatewayRequest | null {
  if (!sessionPattern.test(input.sessionId)) return null
  if (!input.genre || !genreIds.has(input.genre)) return null
  if (!input.horror || !horrorIds.has(input.horror)) return null
  if (input.customScript !== null && (typeof input.customScript !== 'string' || !input.customScript.trim() || input.customScript.length > 3_000)) return null

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const message of input.messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue
    if (typeof message.content !== 'string') return null
    const content = message.content.trim()
    if (!content || content.length > 4_000) return null
    messages.push({ role: message.role, content })
  }
  const boundedMessages = messages.slice(-40)
  if (!boundedMessages.length) return null

  const candidate = input.mode === 'document'
    ? {
        mode: 'document' as const,
        sessionId: input.sessionId,
        genre: input.genre,
        horror: input.horror,
        customScript: input.customScript?.trim() ?? null,
        messages: boundedMessages,
        documentSoFar: input.documentSoFar,
        documentSegment: input.documentSegment,
        documentGrant: input.documentGrant,
      }
    : {
        mode: 'turn' as const,
        sessionId: input.sessionId,
        genre: input.genre,
        horror: input.horror,
        customScript: input.customScript?.trim() ?? null,
        messages: boundedMessages,
      }
  const parsed = storyGatewayRequestSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}
