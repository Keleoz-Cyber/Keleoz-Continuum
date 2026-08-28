import { describe, expect, it, vi } from 'vitest'

import {
  ROOM_SOURCE_STATE_KEY,
  clearRoomSourceStateInstall,
  createRoomSourceStateChannel,
  createRoomSourceStateFailover,
  createRoomSourceStateLeases,
  decodeRoomSourceStateRecord,
  encodeRoomSourceStateRecord,
  normalizeRoomSourceState,
} from '@/modules/room/source-state'

const sourceState = JSON.stringify({
  outfitIdx: 5,
  charX: 450,
  charY: 460,
  facing: 'up',
  state: 'lying',
  lieMode: 'sleeping',
  isFirstOpen: false,
})

describe('Room source state adapter', () => {
  it('keeps the source key in memory and mirrors it to the versioned browser store', async () => {
    const persist = vi.fn(async () => undefined)
    const delegateGet = vi.fn(() => 'other-value')
    const delegateSet = vi.fn()
    const channel = createRoomSourceStateChannel(sourceState, persist)

    expect(channel.getItem(ROOM_SOURCE_STATE_KEY, delegateGet)).toBe(sourceState)
    channel.setItem(ROOM_SOURCE_STATE_KEY, sourceState, delegateSet)
    await channel.flush()

    expect(persist).toHaveBeenCalledWith(sourceState)
    expect(delegateGet).not.toHaveBeenCalled()
    expect(delegateSet).not.toHaveBeenCalled()
  })

  it('delegates unrelated localStorage keys without persisting them', async () => {
    const persist = vi.fn(async () => undefined)
    const delegateGet = vi.fn(() => 'theme-value')
    const delegateSet = vi.fn()
    const channel = createRoomSourceStateChannel(null, persist)

    expect(channel.getItem('theme', delegateGet)).toBe('theme-value')
    channel.setItem('theme', 'internal', delegateSet)
    await channel.flush()

    expect(delegateGet).toHaveBeenCalledOnce()
    expect(delegateSet).toHaveBeenCalledWith('theme', 'internal')
    expect(persist).not.toHaveBeenCalled()
  })

  it('clears only the bridged source key from the versioned store', async () => {
    const persist = vi.fn(async () => undefined)
    const delegateRemove = vi.fn()
    const channel = createRoomSourceStateChannel(sourceState, persist)

    channel.removeItem(ROOM_SOURCE_STATE_KEY, delegateRemove)
    await channel.flush()

    expect(channel.getItem(ROOM_SOURCE_STATE_KEY, () => 'legacy')).toBeNull()
    expect(persist).toHaveBeenCalledWith(null)
    expect(delegateRemove).not.toHaveBeenCalled()
  })

  it('rejects corrupt or out-of-contract source state before hydration', () => {
    expect(normalizeRoomSourceState('{broken')).toBeNull()
    expect(normalizeRoomSourceState(JSON.stringify({ outfitIdx: 9 }))).toBeNull()
    expect(normalizeRoomSourceState(sourceState)).toBe(sourceState)
  })

  it('wraps source state in an explicit versioned IndexedDB record', () => {
    const record = encodeRoomSourceStateRecord(sourceState, 1_777_777)

    expect(record).toEqual({
      id: 'wardrobe-sleep',
      version: 1,
      sourceState,
      updatedAt: 1_777_777,
    })
    expect(decodeRoomSourceStateRecord(record)).toBe(sourceState)
    expect(decodeRoomSourceStateRecord({ ...record, version: 2 })).toBeNull()
    expect(decodeRoomSourceStateRecord({ ...record, updatedAt: -1 })).toBeNull()
    expect(decodeRoomSourceStateRecord({ ...record, updatedAt: 'now' })).toBeNull()
  })

  it('rejects coordinates outside the immutable Room world', () => {
    const parsed = JSON.parse(sourceState)

    expect(normalizeRoomSourceState(JSON.stringify({ ...parsed, charX: -1 }))).toBeNull()
    expect(normalizeRoomSourceState(JSON.stringify({ ...parsed, charY: 942 }))).toBeNull()
    expect(normalizeRoomSourceState(JSON.stringify({ ...parsed, charX: 1672, charY: 941 }))).not.toBeNull()
  })

  it('switches permanently to native fallback after a runtime persistence failure', async () => {
    const primary = vi.fn()
      .mockRejectedValueOnce(new Error('quota'))
      .mockResolvedValue(undefined)
    const fallback = vi.fn()
    const persist = createRoomSourceStateFailover(primary, fallback)

    await persist(sourceState)
    await persist(null)

    expect(primary).toHaveBeenCalledOnce()
    expect(fallback).toHaveBeenNthCalledWith(1, sourceState, expect.any(Error))
    expect(fallback).toHaveBeenNthCalledWith(2, null)
  })

  it('keeps a shared bridge alive until concurrent and cancelled acquisitions release', () => {
    const onEmpty = vi.fn()
    const leases = createRoomSourceStateLeases(onEmpty)
    const releaseCancelled = leases.acquire()
    const releaseMounted = leases.acquire()

    releaseCancelled()
    releaseCancelled()
    expect(onEmpty).not.toHaveBeenCalled()

    releaseMounted()
    expect(onEmpty).toHaveBeenCalledOnce()
  })

  it('does not let a rejected install generation clear its replacement', () => {
    const rejected = Promise.reject(new Error('old')).catch(() => undefined)
    const replacement = Promise.resolve(undefined)

    expect(clearRoomSourceStateInstall(rejected, rejected)).toBeNull()
    expect(clearRoomSourceStateInstall(replacement, rejected)).toBe(replacement)
  })
})
