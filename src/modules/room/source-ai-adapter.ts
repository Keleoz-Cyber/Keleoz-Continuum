import { saveStoryHistoryRecord } from '@/modules/story/local-history-browser'
import { normalizeStorySourcePost } from '@/modules/story/local-history'
import { createStoryGatewayPayload } from '@/modules/story/source-adapter'
import { saveTeaHistoryRecord } from '@/modules/tea/local-history-browser'
import { normalizeTeaSourcePost } from '@/modules/tea/local-history'
import { createTeaGatewayPayload } from '@/modules/tea/source-adapter'

export type RoomAiFeature = 'tea' | 'story' | 'tarot' | 'other' | null

type SourceMessage = { role?: unknown; content?: unknown }
type GatewayMessage = { role: 'user' | 'assistant'; content: string }

export type StoryDocumentSnapshot = {
  sessionId: string
  sourceSession: number | null
  genre: string
  horror: string
  customScript: string | null
  messages: GatewayMessage[]
  documentSoFar: string
  documentSegment: number
  documentGrant: string
}

export function createStoryDocumentSnapshot(input: {
  sessionId: string
  sourceSession: number | null
  genre: string
  horror: string
  customScript: string | null
  messages: GatewayMessage[]
  endingContent: string
  documentGrant: string
}): StoryDocumentSnapshot {
  return {
    sessionId: input.sessionId,
    sourceSession: input.sourceSession,
    genre: input.genre,
    horror: input.horror,
    customScript: input.customScript,
    messages: [
      ...input.messages.map((message) => ({ ...message })),
      { role: 'assistant', content: input.endingContent },
    ],
    documentSoFar: '',
    documentSegment: 0,
    documentGrant: input.documentGrant,
  }
}

export function advanceStoryDocumentSnapshot(
  snapshot: StoryDocumentSnapshot,
  result: { content: string; truncated: boolean; documentGrant?: string },
) {
  if (!result.truncated) return snapshot
  if (!result.documentGrant || snapshot.documentSegment >= 3) return null
  return {
    ...snapshot,
    documentSoFar: snapshot.documentSoFar + result.content,
    documentSegment: snapshot.documentSegment + 1,
    documentGrant: result.documentGrant,
  }
}

export function roomAiFeatureForAction(action: string): RoomAiFeature {
  if (action === 'tea') return 'tea'
  if (action === 'desk') return 'story'
  if (action === 'crystal') return 'tarot'
  return 'other'
}

export function roomFeatureHasCompanion(feature: RoomAiFeature) {
  return feature === 'tea' || feature === 'story'
}

export function storyModeForSourceCall(input: { documentSaving: boolean; wantMeta: boolean }) {
  return input.documentSaving && input.wantMeta ? 'document' as const : 'turn' as const
}

export function documentContinuationFromSourceMessages(messages: SourceMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role === 'assistant' && typeof message.content === 'string') {
      return message.content
    }
  }
  return ''
}

type SourceGame = {
  teaDrink?: string | null
  teaDessert?: string | null
  teaRound?: number
  _aiSession?: number
  _aiGenre?: string | null
  _aiHorror?: string | null
  _aiCustomScript?: string | null
  _docSaving?: boolean
  aiGameHistory?: SourceMessage[]
}

async function fetchGateway(path: string, payload: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body: unknown = await response.json().catch(() => null)
  const result = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  if (!response.ok) {
    throw new Error(typeof result.error === 'string' ? result.error : '访客 AI 暂时没有回应。')
  }
  if (typeof result.content !== 'string' || !result.content.trim()) {
    throw new Error('访客 AI 返回了无效内容。')
  }
  return {
    content: result.content,
    truncated: result.truncated === true,
    documentGrant: typeof result.documentGrant === 'string' ? result.documentGrant : undefined,
  }
}

export function installRoomSourceAiAdapter(options: { companionName: string }) {
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
  let activeFeature: RoomAiFeature = null
  let teaSessionId: string | null = null
  let storySessionId: string | null = null
  let storySourceSession: number | null = null
  let storyDocumentSnapshot: StoryDocumentSnapshot | null = null
  const companion = {
    id: 'continuum-site-companion',
    nickname: options.companionName,
    model: 'site-companion',
    relationship: '站点访客与数字空间主人',
    streaming: false,
    storyPersonalize: false,
  }

  const identifyInteraction = (event: Event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-action], .ix-marker[data-id]')
      : null
    const action = target?.dataset.action ?? target?.dataset.id
    if (action) activeFeature = roomAiFeatureForAction(action)
  }
  document.addEventListener('click', identifyInteraction, true)

  Object.defineProperty(sourceWindow, 'apiConfigs', {
    configurable: true,
    get: () => roomFeatureHasCompanion(activeFeature) ? [companion] : [],
  })
  Object.defineProperty(sourceWindow, 'loadApiConfigs', { configurable: true, value: () => undefined })
  Object.defineProperty(sourceWindow, 'callApiChat', {
    configurable: true,
    value: async (_config: unknown, messages: SourceMessage[], callOptions?: { wantMeta?: boolean }) => {
      const game = sourceWindow.G as SourceGame | undefined
      if (!game) throw new Error('Room 尚未准备好。')
      const continuingStoryDocument = callOptions?.wantMeta === true && storyDocumentSnapshot !== null

      if (activeFeature === 'tea' && !continuingStoryDocument) {
        const eligibleMessages = messages.filter((message) => message.role === 'user' || message.role === 'assistant')
        if (!teaSessionId || (game.teaRound === 0 && eligibleMessages.length <= 1)) teaSessionId = crypto.randomUUID()
        const payload = createTeaGatewayPayload({
          sessionId: teaSessionId,
          drink: game.teaDrink ?? null,
          dessert: game.teaDessert ?? null,
          isNight: document.body.classList.contains('theme-infernal'),
          messages,
        })
        if (!payload) throw new Error('Tea 请求内容不符合要求。')
        return (await fetchGateway('/api/ai/tea', payload)).content
      }

      if (activeFeature === 'story' || continuingStoryDocument) {
        if (!storySessionId || storySourceSession !== (game._aiSession ?? null)) {
          storySessionId = crypto.randomUUID()
          storySourceSession = game._aiSession ?? null
        }
        const mode = storyModeForSourceCall({
          documentSaving: continuingStoryDocument || game._docSaving === true,
          wantMeta: callOptions?.wantMeta === true,
        })
        const payload = mode === 'document' && storyDocumentSnapshot
          ? createStoryGatewayPayload({
              mode,
              sessionId: storyDocumentSnapshot.sessionId,
              genre: storyDocumentSnapshot.genre,
              horror: storyDocumentSnapshot.horror,
              customScript: storyDocumentSnapshot.customScript,
              messages: storyDocumentSnapshot.messages,
              documentSoFar: storyDocumentSnapshot.documentSoFar,
              documentSegment: storyDocumentSnapshot.documentSegment,
              documentGrant: storyDocumentSnapshot.documentGrant,
            })
          : createStoryGatewayPayload({
              mode,
              sessionId: storySessionId,
              genre: game._aiGenre ?? null,
              horror: game._aiHorror ?? null,
              customScript: game._aiCustomScript ?? null,
              messages: game.aiGameHistory ?? messages,
              documentSoFar: '',
            })
        if (!payload) throw new Error('Story 请求内容不符合要求。')
        const result = await fetchGateway('/api/ai/story', payload)
        if (mode === 'turn' && result.documentGrant && payload.mode === 'turn') {
          storyDocumentSnapshot = createStoryDocumentSnapshot({
            sessionId: payload.sessionId,
            sourceSession: game._aiSession ?? null,
            genre: payload.genre,
            horror: payload.horror,
            customScript: payload.customScript,
            messages: payload.messages,
            endingContent: result.content,
            documentGrant: result.documentGrant,
          })
        } else if (mode === 'document' && storyDocumentSnapshot) {
          const next = advanceStoryDocumentSnapshot(storyDocumentSnapshot, result)
          if (result.truncated && !next) throw new Error('Story 文档续写授权无效。')
          storyDocumentSnapshot = next ?? storyDocumentSnapshot
        }
        return callOptions?.wantMeta ? { text: result.content, truncated: result.truncated } : result.content
      }

      throw new Error('该互动尚未开放。')
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
      if (normalizeTeaSourcePost(value)) return saveTeaHistoryRecord(value)
      const storyRecord = normalizeStorySourcePost(value)
      if (storyRecord) {
        await saveStoryHistoryRecord(value)
        if (storyRecord.stage !== 'generating') storyDocumentSnapshot = null
        return
      }
      throw new Error('This feature cannot save yet')
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
