'use client'

import { useEffect, useRef, useState } from 'react'

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
    const previousNavTo = window.navTo
    window.navTo = (page) => {
      document.querySelectorAll('.source-room-page .page').forEach((element) => element.classList.remove('active'))
      document.getElementById(`page-${page}`)?.classList.add('active')
    }
    const script = document.createElement('script')
    script.src = '/game/game_module.js'
    script.async = false
    script.onload = () => {
      setLoaded(true)
      window.setTimeout(startRoom, 60)
    }
    script.onerror = () => setLoaded(true)
    scriptRef.current = script
    document.body.appendChild(script)
    return () => {
      script.remove()
      scriptRef.current = null
      document.getElementById('game-css')?.remove()
      document.getElementById('game-panel')?.remove()
      document.getElementById('game-pet-window')?.remove()
      document.getElementById('game-mini')?.remove()
      if (previousNavTo) window.navTo = previousNavTo
      else delete window.navTo
    }
  }, [])

  if (mobile) {
    return <main className="source-room-page source-room-mobile-note"><div><h1>Room</h1><p>Room 是桌面端的像素空间，请在较宽屏幕上打开。</p><small>Mobile 端的 Tea、Story、Tarot 与 Character 入口会以独立 App 形式提供。</small></div></main>
  }

  return (
    <main className="source-room-page">
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
  }
}
