import { normalizeRoomSourceState } from '@/modules/room/source-state'

export const CHARACTER_OUTFITS: ReadonlyArray<{
  id: string
  label: string
  walk: string
  idle: string
  lie: string
  portrait: string
}> = [
  { id: 'eyepatch_dress', label: 'Gothic Dress', walk: '/game/sprites/walk_eyepatch_dress.png', idle: '/game/sprites/idle_eyepatch_dress.png', lie: '/game/sprites/lie_eyepatch_dress.png', portrait: '/game/portraits/eyepatch_dress.png' },
  { id: 'nopatch_dress', label: 'Gothic Dress (no patch)', walk: '/game/sprites/walk_nopatch_dress.png', idle: '/game/sprites/idle_nopatch_dress.png', lie: '/game/sprites/lie_nopatch_dress.png', portrait: '/game/portraits/nopatch_dress.png' },
  { id: 'casual', label: 'Casual', walk: '/game/sprites/walk_casual.png', idle: '/game/sprites/idle_casual.png', lie: '/game/sprites/lie_casual.png', portrait: '/game/portraits/casual.png' },
  { id: 'salome', label: 'Salome', walk: '/game/sprites/walk_salome.png', idle: '/game/sprites/idle_salome.png', lie: '/game/sprites/lie_salome.png', portrait: '/game/portraits/salome.png' },
  { id: 'jk', label: 'JK', walk: '/game/sprites/walk_jk.png', idle: '/game/sprites/idle_jk.png', lie: '/game/sprites/lie_jk.png', portrait: '/game/portraits/jk.png' },
  { id: 'wedding', label: 'Wedding', walk: '/game/sprites/walk_wedding.png', idle: '/game/sprites/idle_wedding.png', lie: '/game/sprites/lie_wedding.png', portrait: '/game/portraits/wedding.png' },
]

export const CHARACTER_WARDROBE_LINES = [
  '让我偶尔试试你喜欢的风格，怎么样？',
  '想看我穿什么样的衣服呢？',
  '（小声）想买新衣服了……',
] as const

const sourceSleepPrompt = '现在我该睡觉了吗？'
const sourceSleepConfirmation = '我知道了，好。\n晚安。'

interface CharacterSourceState {
  outfitIdx: number
  charX: number
  charY: number
  facing: 'up' | 'down' | 'left' | 'right'
  state: 'idle' | 'walking' | 'interacting' | 'lying' | 'sleeping' | 'waking' | 'sitting'
  lieMode: 'awake' | 'sleeping'
  isFirstOpen: boolean
}

const defaultSourceState: CharacterSourceState = {
  outfitIdx: 2,
  charX: 350,
  charY: 550,
  facing: 'down',
  state: 'idle',
  lieMode: 'awake',
  isFirstOpen: false,
}

export type MobileCharacterPhase =
  | 'awake'
  | 'wardrobe-intro'
  | 'wardrobe'
  | 'sleep-prompt'
  | 'sleep-confirm'
  | 'falling-asleep'
  | 'sleeping'
  | 'waking'

export interface MobileCharacterState {
  outfitIdx: number
  phase: MobileCharacterPhase
  dialogue: string | null
  sourceState: string
}

export type MobileCharacterEvent =
  | { type: 'open-wardrobe'; lineIndex: number }
  | { type: 'select-outfit'; outfitIdx: number }
  | { type: 'close-wardrobe' }
  | { type: 'open-sleep' }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'sleep' }
  | { type: 'wake' }
  | { type: 'awake' }

function parseSourceState(sourceState: string | null): CharacterSourceState | null {
  const normalized = normalizeRoomSourceState(sourceState)
  return normalized ? JSON.parse(normalized) as CharacterSourceState : null
}

function withSourceState(
  state: MobileCharacterState,
  changes: Partial<CharacterSourceState>,
  phase: MobileCharacterPhase,
) {
  const current = parseSourceState(state.sourceState) ?? defaultSourceState
  const next = { ...current, ...changes }
  return { ...state, outfitIdx: next.outfitIdx, phase, dialogue: null, sourceState: JSON.stringify(next) }
}

export function createMobileCharacterState(sourceState: string | null): MobileCharacterState {
  const parsed = parseSourceState(sourceState)
  const initial = parsed ?? defaultSourceState
  const sleeping = (initial.state === 'sleeping' || initial.state === 'lying') && initial.lieMode === 'sleeping'
  return {
    outfitIdx: initial.outfitIdx,
    phase: sleeping ? 'sleeping' : 'awake',
    dialogue: null,
    sourceState: parsed ? sourceState! : JSON.stringify(defaultSourceState),
  }
}

export function transitionMobileCharacter(state: MobileCharacterState, event: MobileCharacterEvent): MobileCharacterState {
  switch (event.type) {
    case 'open-wardrobe': {
      if (state.phase !== 'awake') return state
      const lineIndex = Math.abs(Math.trunc(event.lineIndex)) % CHARACTER_WARDROBE_LINES.length
      return { ...state, phase: 'wardrobe-intro', dialogue: CHARACTER_WARDROBE_LINES[lineIndex] }
    }
    case 'select-outfit':
      if (state.phase !== 'wardrobe' || !Number.isInteger(event.outfitIdx) || !CHARACTER_OUTFITS[event.outfitIdx]) return state
      return withSourceState(state, { outfitIdx: event.outfitIdx, state: 'idle', lieMode: 'awake' }, 'awake')
    case 'close-wardrobe':
      return state.phase === 'wardrobe' ? { ...state, phase: 'awake', dialogue: null } : state
    case 'open-sleep':
      return state.phase === 'awake' ? { ...state, phase: 'sleep-prompt', dialogue: sourceSleepPrompt } : state
    case 'next':
      if (state.phase === 'wardrobe-intro') return { ...state, phase: 'wardrobe', dialogue: null }
      if (state.phase === 'sleep-prompt') return { ...state, phase: 'sleep-confirm', dialogue: sourceSleepConfirmation }
      if (state.phase === 'sleep-confirm') return { ...state, phase: 'falling-asleep', dialogue: null }
      return state
    case 'back':
      if (['wardrobe-intro', 'wardrobe', 'sleep-prompt', 'sleep-confirm'].includes(state.phase)) {
        return { ...state, phase: 'awake', dialogue: null }
      }
      return state
    case 'sleep':
      return state.phase === 'falling-asleep'
        ? withSourceState(state, { charX: 450, charY: 460, facing: 'up', state: 'lying', lieMode: 'sleeping', isFirstOpen: false }, 'sleeping')
        : state
    case 'wake':
      return state.phase === 'sleeping' ? { ...state, phase: 'waking', dialogue: null } : state
    case 'awake':
      return state.phase === 'waking'
        ? withSourceState(state, { charX: 350, charY: 550, facing: 'down', state: 'idle', lieMode: 'awake', isFirstOpen: false }, 'awake')
        : state
  }
}

export function characterDialogueText(state: MobileCharacterState) {
  return state.dialogue
}

export function projectMobileCharacterSourceState(state: MobileCharacterState) {
  return state.sourceState
}
