'use client'

import { useEffect, useRef, useState } from 'react'

import { acquireRoomSourceStateBridge } from './source-state-browser'

function stopSourceRoomRuntime() {
  try {
    window.navTo?.('home')
  } catch (error) {
    console.warn('Room source navigation could not be paused during teardown.', error)
  }

  const game = window.G
  if (!game) return
  game.running = false
  game.state = 'idle'
  if (typeof game.animFrame === 'number') window.cancelAnimationFrame(game.animFrame)
  if (typeof game.typewriterTimer === 'number') window.clearInterval(game.typewriterTimer)
  if (typeof game._interactTimeout === 'number') window.clearTimeout(game._interactTimeout)
  if (typeof game._teaAnimInterval === 'number') window.clearInterval(game._teaAnimInterval)
  if (typeof game._deskSprTimer === 'number') window.clearInterval(game._deskSprTimer)
  if (typeof game.swFrameTimer === 'number') window.clearInterval(game.swFrameTimer)
  if (typeof game.swBubbleTimer === 'number') window.clearInterval(game.swBubbleTimer)
  game._teaThemeObs?.disconnect()
  game.swThemeObs?.disconnect()
  game.viewport = null
  game.container = null
}

export function RoomClient() {
  const [loaded, setLoaded] = useState(false)
  const [mobile, setMobile] = useState(false)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  function startRoom() {
    if (typeof window.navTo === 'function') {
      window.navTo('game')
      return
    }
    setTimeout(() => window.navTo?.('game'), 0)
  }

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    if (query.matches) {
      window.setTimeout(() => setMobile(true), 0)
      return
    }
    let cancelled = false
    let releaseStateBridge: (() => void) | undefined
    let startTimer: number | undefined
    const previousNavTo = window.navTo

    const mountSourceRuntime = () => {
      if (cancelled) {
        return
      }
      window.navTo = (page) => {
        document.querySelectorAll('.source-room-page .page').forEach((element) => element.classList.remove('active'))
        document.getElementById(`page-${page}`)?.classList.add('active')
      }
      const script = document.createElement('script')
      script.src = '/game/game_module.js'
      script.async = false
      script.onload = () => {
        setLoaded(true)
        startTimer = window.setTimeout(startRoom, 60)
      }
      script.onerror = () => setLoaded(true)
      scriptRef.current = script
      document.body.appendChild(script)
    }

    void acquireRoomSourceStateBridge()
      .then((release) => {
        if (cancelled) {
          release()
          return
        }
        releaseStateBridge = release
        mountSourceRuntime()
      })
      .catch((error) => {
        console.warn('Room state bridge failed; loading the immutable source runtime without it.', error)
        mountSourceRuntime()
      })
    return () => {
      cancelled = true
      if (startTimer !== undefined) window.clearTimeout(startTimer)
      stopSourceRoomRuntime()
      scriptRef.current?.remove()
      scriptRef.current = null
      document.getElementById('game-css')?.remove()
      document.getElementById('game-panel')?.remove()
      document.getElementById('game-pet-window')?.remove()
      document.getElementById('game-mini')?.remove()
      if (previousNavTo) window.navTo = previousNavTo
      else delete window.navTo
      releaseStateBridge?.()
    }
  }, [])

  if (mobile) {
    return <main className="source-room-page source-room-mobile-note"><div><h1>Room</h1><p>Room 是桌面端的像素空间，请在较宽屏幕上打开。</p><small>Mobile 端的 Tea、Story、Tarot 与 Character 入口会以独立 App 形式提供。</small></div></main>
  }

  return (
    <main className="source-room-page">
      <div className="source-public-bg" aria-hidden="true" />
      <div id="app">
        <div id="splash" className="hidden" />
        <div className="page" id="page-home" />
        <nav id="navbar" className="visible" aria-hidden="true"><ul className="nav-links" /></nav>
      </div>
      {!loaded ? <div className="source-room-loading" aria-live="polite">Loading Room…</div> : null}
    </main>
  )
}

declare global {
  interface Window {
    navTo?: (page: string) => void
    G?: {
      running?: boolean
      state?: string
      animFrame?: number | null
      typewriterTimer?: number | null
      _interactTimeout?: number | null
      _teaAnimInterval?: number | null
      _deskSprTimer?: number | null
      swFrameTimer?: number | null
      swBubbleTimer?: number | null
      _teaThemeObs?: MutationObserver
      swThemeObs?: MutationObserver
      viewport?: HTMLElement | null
      container?: HTMLElement | null
    }
  }
}
