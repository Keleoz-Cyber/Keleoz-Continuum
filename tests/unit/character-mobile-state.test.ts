import { describe, expect, it } from 'vitest'

import {
  CHARACTER_OUTFITS,
  characterDialogueText,
  createMobileCharacterState,
  projectMobileCharacterSourceState,
  transitionMobileCharacter,
} from '@/modules/character/mobile-state'

const savedWeddingSleep = JSON.stringify({
  outfitIdx: 5,
  charX: 450,
  charY: 460,
  facing: 'up',
  state: 'lying',
  lieMode: 'sleeping',
  isFirstOpen: false,
})

describe('Mobile Character source contract', () => {
  it('keeps the exact six Desktop outfits and synchronized source assets', () => {
    expect(CHARACTER_OUTFITS).toEqual([
      { id: 'eyepatch_dress', label: 'Gothic Dress', walk: '/game/sprites/walk_eyepatch_dress.png', idle: '/game/sprites/idle_eyepatch_dress.png', lie: '/game/sprites/lie_eyepatch_dress.png', portrait: '/game/portraits/eyepatch_dress.png' },
      { id: 'nopatch_dress', label: 'Gothic Dress (no patch)', walk: '/game/sprites/walk_nopatch_dress.png', idle: '/game/sprites/idle_nopatch_dress.png', lie: '/game/sprites/lie_nopatch_dress.png', portrait: '/game/portraits/nopatch_dress.png' },
      { id: 'casual', label: 'Casual', walk: '/game/sprites/walk_casual.png', idle: '/game/sprites/idle_casual.png', lie: '/game/sprites/lie_casual.png', portrait: '/game/portraits/casual.png' },
      { id: 'salome', label: 'Salome', walk: '/game/sprites/walk_salome.png', idle: '/game/sprites/idle_salome.png', lie: '/game/sprites/lie_salome.png', portrait: '/game/portraits/salome.png' },
      { id: 'jk', label: 'JK', walk: '/game/sprites/walk_jk.png', idle: '/game/sprites/idle_jk.png', lie: '/game/sprites/lie_jk.png', portrait: '/game/portraits/jk.png' },
      { id: 'wedding', label: 'Wedding', walk: '/game/sprites/walk_wedding.png', idle: '/game/sprites/idle_wedding.png', lie: '/game/sprites/lie_wedding.png', portrait: '/game/portraits/wedding.png' },
    ])
  })

  it('preserves the source Wardrobe introduction and applies one outfit to the shared source record', () => {
    let state = createMobileCharacterState(null)
    expect(state.outfitIdx).toBe(2)

    state = transitionMobileCharacter(state, { type: 'open-wardrobe', lineIndex: 1 })
    expect(state.phase).toBe('wardrobe-intro')
    expect(characterDialogueText(state)).toBe('想看我穿什么样的衣服呢？')

    state = transitionMobileCharacter(state, { type: 'next' })
    state = transitionMobileCharacter(state, { type: 'select-outfit', outfitIdx: 4 })
    expect(state.phase).toBe('awake')
    expect(state.outfitIdx).toBe(4)
    expect(JSON.parse(projectMobileCharacterSourceState(state))).toMatchObject({
      outfitIdx: 4,
      state: 'idle',
      lieMode: 'awake',
    })
  })

  it('keeps the two source Sleep dialogue stages and explicit sleep/wake transitions', () => {
    let state = createMobileCharacterState(null)
    state = transitionMobileCharacter(state, { type: 'open-sleep' })
    expect(characterDialogueText(state)).toBe('现在我该睡觉了吗？')

    state = transitionMobileCharacter(state, { type: 'next' })
    expect(state.phase).toBe('sleep-confirm')
    expect(characterDialogueText(state)).toBe('我知道了，好。\n晚安。')

    state = transitionMobileCharacter(state, { type: 'next' })
    expect(state.phase).toBe('falling-asleep')
    state = transitionMobileCharacter(state, { type: 'sleep' })
    expect(JSON.parse(projectMobileCharacterSourceState(state))).toMatchObject({ state: 'lying', lieMode: 'sleeping' })

    state = transitionMobileCharacter(state, { type: 'wake' })
    expect(state.phase).toBe('waking')
    state = transitionMobileCharacter(state, { type: 'awake' })
    expect(JSON.parse(projectMobileCharacterSourceState(state))).toMatchObject({
      charX: 350,
      charY: 550,
      facing: 'down',
      state: 'idle',
      lieMode: 'awake',
      isFirstOpen: false,
    })
  })

  it('hydrates the active outfit and sleeping pose from the existing versioned source state', () => {
    const state = createMobileCharacterState(savedWeddingSleep)

    expect(state.outfitIdx).toBe(5)
    expect(state.phase).toBe('sleeping')
    expect(projectMobileCharacterSourceState(state)).toBe(savedWeddingSleep)
  })

  it('falls back to the source Casual standing state for corrupt records', () => {
    const state = createMobileCharacterState('{broken')

    expect(state.outfitIdx).toBe(2)
    expect(state.phase).toBe('awake')
    expect(JSON.parse(projectMobileCharacterSourceState(state))).toEqual({
      outfitIdx: 2,
      charX: 350,
      charY: 550,
      facing: 'down',
      state: 'idle',
      lieMode: 'awake',
      isFirstOpen: false,
    })
  })
})
