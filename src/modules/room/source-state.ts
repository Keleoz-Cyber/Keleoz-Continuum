export const ROOM_SOURCE_STATE_KEY = 'suiGameState'
export const ROOM_SOURCE_STATE_RECORD_ID = 'wardrobe-sleep'
export const ROOM_SOURCE_STATE_VERSION = 1

export interface RoomSourceStateRecord {
  id: typeof ROOM_SOURCE_STATE_RECORD_ID
  version: typeof ROOM_SOURCE_STATE_VERSION
  sourceState: string
  updatedAt: number
}

const roomStates = new Set(['idle', 'walking', 'interacting', 'lying', 'sleeping', 'waking', 'sitting'])
const facings = new Set(['up', 'down', 'left', 'right'])
const lieModes = new Set(['awake', 'sleeping'])
const roomWidth = 1672
const roomHeight = 941

export function normalizeRoomSourceState(value: string | null): string | null {
  if (!value) return null

  try {
    const state: unknown = JSON.parse(value)
    if (!state || typeof state !== 'object') return null
    const candidate = state as Record<string, unknown>

    if (!Number.isInteger(candidate.outfitIdx) || Number(candidate.outfitIdx) < 0 || Number(candidate.outfitIdx) > 5) return null
    if (typeof candidate.charX !== 'number' || !Number.isFinite(candidate.charX) || candidate.charX < 0 || candidate.charX > roomWidth) return null
    if (typeof candidate.charY !== 'number' || !Number.isFinite(candidate.charY) || candidate.charY < 0 || candidate.charY > roomHeight) return null
    if (typeof candidate.facing !== 'string' || !facings.has(candidate.facing)) return null
    if (typeof candidate.state !== 'string' || !roomStates.has(candidate.state)) return null
    if (typeof candidate.lieMode !== 'string' || !lieModes.has(candidate.lieMode)) return null
    if (typeof candidate.isFirstOpen !== 'boolean') return null

    return value
  } catch {
    return null
  }
}

export function encodeRoomSourceStateRecord(sourceState: string, updatedAt = Date.now()): RoomSourceStateRecord {
  const normalized = normalizeRoomSourceState(sourceState)
  if (!normalized) throw new Error('Invalid Room source state')

  return {
    id: ROOM_SOURCE_STATE_RECORD_ID,
    version: ROOM_SOURCE_STATE_VERSION,
    sourceState: normalized,
    updatedAt,
  }
}

export function decodeRoomSourceStateRecord(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.id !== ROOM_SOURCE_STATE_RECORD_ID || candidate.version !== ROOM_SOURCE_STATE_VERSION) return null
  if (typeof candidate.sourceState !== 'string') return null
  if (typeof candidate.updatedAt !== 'number' || !Number.isFinite(candidate.updatedAt) || candidate.updatedAt < 0) return null
  return normalizeRoomSourceState(candidate.sourceState)
}

export function createRoomSourceStateFailover(
  primary: (value: string | null) => Promise<void>,
  fallback: (value: string | null, error?: unknown) => void,
) {
  let fallbackActive = false

  return async (value: string | null) => {
    if (fallbackActive) {
      fallback(value)
      return
    }

    try {
      await primary(value)
    } catch (error) {
      fallbackActive = true
      fallback(value, error)
    }
  }
}

export function createRoomSourceStateLeases(onEmpty: () => void) {
  let count = 0

  return {
    acquire() {
      count += 1
      let released = false
      return () => {
        if (released) return
        released = true
        count -= 1
        if (count === 0) onEmpty()
      }
    },
  }
}

export function clearRoomSourceStateInstall<T>(current: T | null, completed: T): T | null {
  return current === completed ? null : current
}

export function createRoomSourceStateChannel(
  initialValue: string | null,
  persist: (value: string | null) => Promise<void>,
) {
  let currentValue = normalizeRoomSourceState(initialValue)
  let pending = Promise.resolve()

  return {
    getItem(key: string, delegate: () => string | null) {
      return key === ROOM_SOURCE_STATE_KEY ? currentValue : delegate()
    },
    setItem(key: string, value: string, delegate: (key: string, value: string) => void) {
      if (key !== ROOM_SOURCE_STATE_KEY) {
        delegate(key, value)
        return
      }

      const normalized = normalizeRoomSourceState(value)
      if (!normalized) return
      currentValue = normalized
      pending = pending.then(() => persist(normalized))
    },
    removeItem(key: string, delegate: (key: string) => void) {
      if (key !== ROOM_SOURCE_STATE_KEY) {
        delegate(key)
        return
      }

      currentValue = null
      pending = pending.then(() => persist(null))
    },
    async flush() {
      await pending
    },
  }
}
