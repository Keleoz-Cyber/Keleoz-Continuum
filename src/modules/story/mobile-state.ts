import type { StoryGenre, StoryHorrorLevel } from './contracts'

export const STORY_MOODS = ['calm', 'joy', 'tense', 'sad', 'shock'] as const
export type StoryMood = (typeof STORY_MOODS)[number]
export type MobileStoryMessage = { role: 'user' | 'assistant'; content: string }
export type MobileStoryTurn = {
  story: string
  choices: string[]
  isEnding: boolean
  endingType: string | null
  mood: StoryMood
}
export type MobileStoryState = {
  sessionId: string
  step: 'setup' | 'playing' | 'ending'
  genre: StoryGenre
  horror: StoryHorrorLevel
  round: number
  messages: MobileStoryMessage[]
  current: MobileStoryTurn | null
  documentGrant: string | null
  transcriptRevision: number
}

export function createMobileStoryState(
  sessionId: string,
  genre: StoryGenre = 'fantasy',
  horror: StoryHorrorLevel = 'no',
): MobileStoryState {
  return {
    sessionId,
    step: 'setup',
    genre,
    horror,
    round: 0,
    messages: [],
    current: null,
    documentGrant: null,
    transcriptRevision: 0,
  }
}

export function startMobileStory(state: MobileStoryState): MobileStoryState {
  if (state.step !== 'setup') return state
  return {
    ...state,
    step: 'playing',
    round: 1,
    messages: [{ role: 'user', content: '开始游戏' }],
    current: null,
    documentGrant: null,
    transcriptRevision: 1,
  }
}

function normalizedMood(value: unknown): StoryMood {
  return typeof value === 'string' && (STORY_MOODS as readonly string[]).includes(value)
    ? value as StoryMood
    : 'calm'
}

export function parseSourceStoryReply(content: string): MobileStoryTurn {
  try {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('No JSON block')
    const value = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>
    const story = typeof value.story === 'string' && value.story.trim() ? value.story : content
    const isEnding = value.isEnding === true
    const choices = Array.isArray(value.choices)
      ? value.choices.filter((choice): choice is string => typeof choice === 'string' && Boolean(choice.trim())).slice(0, 3)
      : []
    return {
      story,
      choices: isEnding ? [] : choices.length ? choices : ['继续'],
      isEnding,
      endingType: typeof value.endingType === 'string' ? value.endingType : null,
      mood: normalizedMood(value.mood),
    }
  } catch {
    return {
      story: content,
      choices: ['继续', '返回'],
      isEnding: false,
      endingType: null,
      mood: 'calm',
    }
  }
}

export function applyMobileStoryReply(
  state: MobileStoryState,
  content: string,
  documentGrant: string | null,
): MobileStoryState {
  const current = parseSourceStoryReply(content)
  return {
    ...state,
    step: current.isEnding ? 'ending' : 'playing',
    messages: [...state.messages, { role: 'assistant', content }],
    current,
    documentGrant: current.isEnding ? documentGrant : null,
    transcriptRevision: state.transcriptRevision + 1,
  }
}

export function chooseMobileStoryOption(
  state: MobileStoryState,
  choice: string,
  roundLimit: number,
): MobileStoryState {
  if (state.step !== 'playing' || !state.current || state.current.isEnding || state.round >= roundLimit) return state
  const content = choice.trim()
  if (!content) return state
  return {
    ...state,
    round: state.round + 1,
    messages: [...state.messages, { role: 'user', content }],
    current: null,
    transcriptRevision: state.transcriptRevision + 1,
  }
}

export function mobileStoryRoundLimit(maxRequestsPerSession: number) {
  return Math.max(0, Math.min(16, Math.floor(maxRequestsPerSession) - 4))
}
