import { saveStoryHistoryRecord } from '@/modules/story/local-history-browser'
import { normalizeStorySourcePost } from '@/modules/story/local-history'
import { createStoryGatewayPayload } from '@/modules/story/source-adapter'
import { saveTeaHistoryRecord } from '@/modules/tea/local-history-browser'
import { normalizeTeaSourcePost } from '@/modules/tea/local-history'
import { createTeaGatewayPayload } from '@/modules/tea/source-adapter'
import { normalizeTarotSourcePost } from '@/modules/tarot/local-history'
import { saveTarotHistoryRecord } from '@/modules/tarot/local-history-browser'
import { createTarotFollowupPayload, createTarotReadingPayload } from '@/modules/tarot/source-adapter'

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
  return feature === 'tea' || feature === 'story' || feature === 'tarot'
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
  _tarot?: {
    spread?: { id?: string }
    guide?: boolean
    slots?: Array<{ card?: Record<string, unknown>; reversed?: boolean } | null>
    readingText?: string
    _history?: SourceMessage[] | null
  }
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
    followupGrant: typeof result.followupGrant === 'string' ? result.followupGrant : undefined,
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
  let tarotSnapshot: {
    sessionId: string; spread: string; guide: boolean
    cards: Array<{ cardId: string; reversed: boolean }>
    followupIndex: number; followupGrant: string | null
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  } | null = null
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
  const alignTarotFanHit = (event: Event) => {
    if (!(event instanceof PointerEvent || event instanceof MouseEvent)) return
    const target = event.target instanceof Element ? event.target : null
    const fan = target?.closest<HTMLElement>('#tarot-fan')
    if (!fan) return
    const cards = Array.from(fan.querySelectorAll<HTMLElement>('.tarot-fan-card:not(.picked)'))
    cards.forEach((card) => card.classList.remove('lift'))
    const actual = document.elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element.classList.contains('tarot-fan-card') && fan.contains(element)) as HTMLElement | undefined
    const centers = (fan as HTMLElement & { _centers?: Array<{ el: HTMLElement; x: number; y: number }> })._centers
    if (!centers) return
    const bounds = fan.getBoundingClientRect()
    const pointerX = event.clientX - bounds.left
    const pointerY = event.clientY - bounds.top
    centers.forEach((center, index) => {
      if (center.el === actual) {
        center.x = pointerX
        center.y = pointerY
      } else {
        center.x = -10_000 - index
        center.y = -10_000
      }
    })
  }
  document.addEventListener('click', identifyInteraction, true)
  document.addEventListener('pointermove', alignTarotFanHit, true)
  document.addEventListener('click', alignTarotFanHit, true)

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

      if (activeFeature === 'tarot') {
        const tarot = game._tarot
        if (!tarot) throw new Error('Tarot 尚未准备好。')
        const initial = !tarotSnapshot || !tarot._history || !tarot.readingText
        if (initial) {
          const payload = createTarotReadingPayload({
            sessionId: crypto.randomUUID(), spread: tarot.spread?.id ?? '', guide: tarot.guide === true,
            slots: tarot.slots ?? [],
          })
          if (!payload) throw new Error('Tarot 请求内容不符合要求。')
          const result = await fetchGateway('/api/ai/tarot', payload)
          tarotSnapshot = {
            sessionId: payload.sessionId, spread: payload.spread, guide: payload.guide, cards: payload.cards,
            followupIndex: 0, followupGrant: result.followupGrant ?? null,
            history: [{ role: 'assistant', content: result.content }],
          }
          return result.content
        }
        const snapshot = tarotSnapshot
        const question = [...messages].reverse().find((message) => message.role === 'user' && typeof message.content === 'string')?.content
        if (typeof question !== 'string' || !snapshot?.followupGrant) throw new Error('Tarot 追问请求不符合要求。')
        const payload = createTarotFollowupPayload({ ...snapshot, question, followupGrant: snapshot.followupGrant })
        if (!payload) throw new Error('Tarot 追问请求不符合要求。')
        const result = await fetchGateway('/api/ai/tarot', payload)
        tarotSnapshot = {
          ...snapshot,
          followupIndex: snapshot.followupIndex + 1,
          followupGrant: result.followupGrant ?? null,
          history: [...snapshot.history, { role: 'user', content: question }, { role: 'assistant', content: result.content }],
        }
        return result.content
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
      if (normalizeTarotSourcePost(value)) return saveTarotHistoryRecord(value)
      throw new Error('This feature cannot save yet')
    },
  })
  Object.defineProperty(sourceWindow, 'ensureDiaryInit', { configurable: true, value: async () => undefined })

  return () => {
    document.removeEventListener('click', identifyInteraction, true)
    document.removeEventListener('pointermove', alignTarotFanHit, true)
    document.removeEventListener('click', alignTarotFanHit, true)
    for (const [name, descriptor] of previousDescriptors) {
      if (descriptor) Object.defineProperty(sourceWindow, name, descriptor)
      else delete sourceWindow[name]
    }
  }
}
