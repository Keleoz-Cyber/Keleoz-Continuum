'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { loadRoomSourceStateFromBrowser, saveRoomSourceStateFromBrowser } from '@/modules/room/source-state-browser'
import {
  CHARACTER_OUTFITS,
  characterDialogueText,
  createMobileCharacterState,
  transitionMobileCharacter,
  type MobileCharacterEvent,
} from './mobile-state'

export function MobileCharacterClient({defaultOutfit=2}:{defaultOutfit?:number}) {
  const router = useRouter()
  const [state, setState] = useState(() => createMobileCharacterState(null))
  const [hydrated, setHydrated] = useState(false)
  const [sleepFrame, setSleepFrame] = useState(1)
  const restoredSleeping = useRef(false)
  const outfit = CHARACTER_OUTFITS[state.outfitIdx] ?? CHARACTER_OUTFITS[2]!
  const sourceState = state.sourceState

  function send(event: MobileCharacterEvent) {
    setState((current) => transitionMobileCharacter(current, event))
  }

  useEffect(() => {
    let cancelled = false
    void loadRoomSourceStateFromBrowser().then((sourceState) => {
      if (cancelled) return
      const next = createMobileCharacterState(sourceState,defaultOutfit)
      restoredSleeping.current = next.phase === 'sleeping'
      setState(next)
      setHydrated(true)
    })
    return () => { cancelled = true }
  }, [defaultOutfit])

  useEffect(() => {
    if (!hydrated) return
    void saveRoomSourceStateFromBrowser(sourceState)
  }, [hydrated, sourceState])

  useEffect(() => {
    if (state.phase !== 'falling-asleep') return
    const timer = window.setTimeout(() => {
      setSleepFrame(1)
      setState((current) => transitionMobileCharacter(current, { type: 'sleep' }))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'sleeping') return
    const frameTimer = window.setInterval(() => setSleepFrame((frame) => frame === 1 ? 2 : 1), 800)
    const autoWakeTimer = restoredSleeping.current
      ? window.setTimeout(() => {
          restoredSleeping.current = false
          setState((current) => transitionMobileCharacter(current, { type: 'wake' }))
        }, 1_500)
      : null
    return () => {
      window.clearInterval(frameTimer)
      if (autoWakeTimer !== null) window.clearTimeout(autoWakeTimer)
    }
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'waking') return
    const timer = window.setTimeout(() => {
      setState((current) => transitionMobileCharacter(current, { type: 'awake' }))
    }, 800)
    return () => window.clearTimeout(timer)
  }, [state.phase])

  function openWardrobe() {
    restoredSleeping.current = false
    send({ type: 'open-wardrobe', lineIndex: Math.floor(Math.random() * 3) })
  }

  function openSleep() {
    restoredSleeping.current = false
    send({ type: 'open-sleep' })
  }

  function wake() {
    if (state.phase === 'sleeping') {
      restoredSleeping.current = false
      send({ type: 'wake' })
    }
  }

  const dialogue = characterDialogueText(state)
  const showStanding = ['awake', 'wardrobe-intro', 'wardrobe', 'sleep-prompt', 'sleep-confirm'].includes(state.phase)
  const showLying = ['falling-asleep', 'sleeping', 'waking'].includes(state.phase)

  return (
    <main className="mobile-character-app">
      <header className="mobile-character-head">
        <button type="button" aria-label="返回" onClick={() => router.back()}>‹</button>
        <h1><strong>Character</strong><small>角色</small></h1>
        <span aria-hidden="true">◇</span>
      </header>

      <section
        className="mobile-character-stage"
        data-phase={state.phase}
        aria-label="Character stage"
        onClick={wake}
      >
        <Image className="mobile-character-room" src="/game/room_day.png" alt="" fill priority unoptimized sizes="100vw" />
        <i className="mobile-character-stage-wash" aria-hidden="true" />
        {showStanding ? (
          <>
            <Image className="mobile-character-portrait" src={outfit.portrait} alt={outfit.label} fill priority unoptimized sizes="(max-width: 600px) 82vw, 420px" />
            <div className="mobile-character-idle" aria-hidden="true">
              <Image src={outfit.idle} alt="" width={441} height={147} unoptimized />
            </div>
          </>
        ) : null}
        {showLying ? (
          <div className="mobile-character-lie" aria-label={state.phase === 'sleeping' ? 'Sleeping' : 'Waking'}>
            <Image
              src={outfit.lie}
              alt=""
              width={614}
              height={151}
              unoptimized
              style={{ left: `${-Math.floor(614 / 3) * (state.phase === 'waking' ? 0 : sleepFrame)}px` }}
            />
          </div>
        ) : null}
        <div className="mobile-character-caption">
          <small>{outfit.id.replaceAll('_', ' ').toUpperCase()}</small>
          <strong>{state.phase === 'sleeping' ? 'Tap to wake' : state.phase === 'waking' ? 'Waking…' : outfit.label}</strong>
        </div>
      </section>

      <nav className="mobile-character-actions" aria-label="Character actions">
        <button type="button" disabled={!hydrated || state.phase !== 'awake'} onClick={openWardrobe}>Wardrobe</button>
        <button type="button" disabled={!hydrated || state.phase !== 'awake'} onClick={openSleep}>Sleep</button>
      </nav>

      {dialogue ? (
        <div className="mobile-character-dialogue" role="dialog" aria-label="Character dialogue">
          <Image src="/game/dialogue_box.png" alt="" fill unoptimized sizes="calc(100vw - 16px)" />
          <strong>Keleoz</strong>
          <p>{dialogue}</p>
          <div>
            <button type="button" aria-label="Back" onClick={() => send({ type: 'back' })}>◂ Back</button>
            <button type="button" aria-label="Next" onClick={() => send({ type: 'next' })}>Next ▸</button>
          </div>
        </div>
      ) : null}

      {state.phase === 'wardrobe' ? (
        <div className="mobile-character-wardrobe" role="dialog" aria-label="Wardrobe">
          <h2>Wardrobe</h2>
          <div className="mobile-character-divider"><span /></div>
          <div className="mobile-character-grid">
            {CHARACTER_OUTFITS.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`mobile-character-outfit ${index === state.outfitIdx ? 'active' : ''}`}
                onClick={() => send({ type: 'select-outfit', outfitIdx: index })}
              >
                <span />{item.label}
              </button>
            ))}
          </div>
          <button type="button" className="mobile-character-close" onClick={() => send({ type: 'close-wardrobe' })}>Close</button>
        </div>
      ) : null}
    </main>
  )
}
