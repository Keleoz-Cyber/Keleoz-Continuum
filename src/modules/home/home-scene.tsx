'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { SourceGlassCanvas } from '@/modules/home/source-glass-canvas'
import { SourceMist } from '@/modules/home/source-mist'
import { SourceMusicPlayer } from '@/modules/home/source-music-player'
import { SourceRain } from '@/modules/home/source-rain'

type Theme = 'internal' | 'infernal'

const desktopNavigation = [
  { href: '/blog', label: 'Blog' },
  { href: '/letters', label: 'Letters' },
  { href: '/music', label: 'Music' },
]

const mobileApps = [
  { href: '/blog', label: '日志', icon: <><path d="M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" /><path d="M18 19.5H7.5a2.5 2.5 0 0 0 0 5H18" /></> },
  { href: '/letters', label: '信箱', icon: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M4.2 7.2 12 13l7.8-5.8" /></> },
  { href: '/music', label: '音乐', icon: <><circle cx="8" cy="17" r="2.6" /><circle cx="17.5" cy="15" r="2.6" /><path d="M10.6 17V6.8l9.5-2.2V15" /></> },
  { href: '#room', label: '房间', icon: <><path d="M4 20V6.5L12 3l8 3.5V20" /><path d="M8 20v-5h8v5M4 20h16" /></> },
  { href: '#tea', label: '茶室', icon: <><path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 5c0 1-.8 1.4-.8 2.4M11 4c0 1-.8 1.4-.8 2.4" /></> },
  { href: '#story', label: '故事', icon: <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21z" /><path d="M5 5.5v15M9 7h6M9 10h7" /></> },
  { href: '#tarot', label: '塔罗', icon: <><rect x="6" y="3" width="12" height="18" rx="1.5" transform="rotate(9 12 12)" /><circle cx="12" cy="11" r="2.3" /></> },
  { href: '#character', label: '角色', icon: <><circle cx="12" cy="8" r="3.2" /><path d="M6 20a6 6 0 0 1 12 0" /></> },
]

function ButterflyMark() {
  return (
    <svg id="ghost-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <path id="gw-fore" d="M11.55 10.9 C10.4 8.1 8.2 5.4 5.6 4.35 C3.35 3.45 1.7 4.5 1.95 6.55 C2.2 8.7 4.3 10.6 6.9 11.45 C8.7 12.03 10.45 11.9 11.55 11.35 Z" />
        <path id="gw-hind" d="M11.6 12.55 C10.1 12.45 7.6 12.85 6.05 14.35 C4.5 15.85 4.75 18.05 6.45 18.75 C8.2 19.45 10.35 18.3 11.35 16.35 C11.95 15.15 12.05 13.6 11.6 12.55 Z" />
        <path id="gw-vein" d="M10.6 10.75 C8.9 9 7 7.1 4.6 5.9 M10.2 11.35 C8.15 10.9 6.05 9.8 4.35 8.25 M10.7 13.1 C9.1 13.55 7.35 14.6 6.35 16.05" />
      </defs>
      <path d="M12 8.7 C11.72 10.4 11.72 13.9 12 16.1" fill="none" />
      <use href="#gw-fore" fill="none" /><use href="#gw-fore" fill="none" transform="matrix(-1,0,0,1,24,0)" />
      <use href="#gw-hind" fill="none" /><use href="#gw-hind" fill="none" transform="matrix(-1,0,0,1,24,0)" />
      <g strokeWidth="0.62" opacity="0.5"><use href="#gw-vein" /><use href="#gw-vein" transform="matrix(-1,0,0,1,24,0)" /></g>
    </svg>
  )
}

function MobileHome() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return (
    <div className="source-mobile-home">
      <div id="top-veil" aria-hidden="true" />
      <header id="topbar" className="glass">
        <button className="icon-btn" type="button" aria-label="菜单" onClick={() => setDrawerOpen(true)}><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
        <div id="tb-title">Home</div><div className="tb-spacer" />
      </header>
      <button className="theme-drop" type="button" title="主题"><svg viewBox="0 0 20 20"><path d="M10 2 C10 2 4 9.5 4 13a6 6 0 0 0 12 0C16 9.5 10 2 10 2z" /></svg></button>
      <button id="drawer-scrim" className={drawerOpen ? 'open' : ''} type="button" aria-label="关闭菜单" onClick={() => setDrawerOpen(false)} />
      <nav id="drawer" className={drawerOpen ? 'open' : ''} aria-label="移动端导航">
        <div className="dw-brand"><div className="dw-user"><span className="dw-avatar">K</span><span id="dw-name">Keleoz</span></div></div>
        <div className="dw-orn" aria-hidden="true"><i /><span>✦</span><i /></div>
        <div className="dw-list">
          <Link className="dw-item active" href="/" onClick={() => setDrawerOpen(false)}><span className="dw-med"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg></span><span className="dw-en">Home</span><span className="dw-cn">主页</span></Link>
          <Link className="dw-item" href="/blog" onClick={() => setDrawerOpen(false)}><span className="dw-med"><svg viewBox="0 0 24 24"><path d="M6 3.5h9L19 8v12.5H6z" /><path d="M14 3.5V8h5M9 12h7M9 16h5" /></svg></span><span className="dw-en">Blog</span><span className="dw-cn">日志</span></Link>
          <Link className="dw-item" href="/letters" onClick={() => setDrawerOpen(false)}><span className="dw-med"><svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M4.5 7l7.5 6 7.5-6" /></svg></span><span className="dw-en">Letters</span><span className="dw-cn">邮局</span></Link>
          <Link className="dw-item" href="/music" onClick={() => setDrawerOpen(false)}><span className="dw-med"><svg viewBox="0 0 24 24"><circle cx="8" cy="17" r="2.4" /><circle cx="17" cy="15" r="2.4" /><path d="M10.4 17V7.2L19.4 5v10" /></svg></span><span className="dw-en">Music</span><span className="dw-cn">音乐</span></Link>
        </div>
        <div className="dw-foot"><span>Keleoz Continuum</span><small>A Personal Digital Space.</small></div>
      </nav>

      <main className="source-mobile-main">
        <section id="page-profile" className="page active"><div className="psec on" id="sec-profile-cal"><div className="sb-desk">
          <div className="wgt sb-hero dk-full">
            <div className="sbh-date"><span>{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span><i aria-hidden="true" /><span>{weekdays[now.getDay()]}</span></div>
            <div className="sbh-top"><div className="sbh-main"><div className="tp-time"><span>{String(now.getHours()).padStart(2, '0')}</span><i>:</i><span>{String(now.getMinutes()).padStart(2, '0')}</span></div><div className="mobile-space-name">Keleoz Continuum</div></div><div className="sbh-duo"><span>K</span><span>∞</span></div></div>
          </div>
          {mobileApps.map((app) => <Link className="sb-app" href={app.href} key={app.label}><span className="sb-ic"><svg viewBox="0 0 24 24">{app.icon}</svg></span><span className="sb-t">{app.label}</span></Link>)}
          <div className="wgt player-w dk-full"><span className="wgt-lab">Continuum</span><div className="mobile-continuum-note"><strong>A Personal Digital Space.</strong><span>一个持续生长的个人数字空间。</span></div></div>
        </div></div></section>
      </main>
      <nav id="dock" className="glass" aria-label="底部导航">
        <Link className="dock-i on" href="/"><svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9H4z" /><path d="M9 20v-6h6v6" /></svg><span>Home</span></Link>
        <Link className="dock-i" href="/blog"><svg viewBox="0 0 24 24"><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" /></svg><span>Blog</span></Link>
        <Link className="dock-i" href="/letters"><svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></svg><span>Letters</span></Link>
        <Link className="dock-i" href="/music"><svg viewBox="0 0 24 24"><circle cx="8" cy="17" r="2.4" /><path d="M10.4 17V7l9-2v10" /></svg><span>Music</span></Link>
      </nav>
    </div>
  )
}

export function HomeScene() {
  const [ready, setReady] = useState(false)
  const [entering, setEntering] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [splashHidden, setSplashHidden] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const [appVisible, setAppVisible] = useState(false)
  const [titleVisible, setTitleVisible] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [creditVisible, setCreditVisible] = useState(false)
  const [glassOff, setGlassOff] = useState(false)
  const [theme, setTheme] = useState<Theme>('internal')
  const [themeFading, setThemeFading] = useState(false)
  const [mobile, setMobile] = useState(false)
  const timersRef = useRef<number[]>([])
  const themeLockedRef = useRef(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const sync = () => setMobile(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const image = new Image()
    let done = false
    const reveal = () => {
      if (done) return
      done = true
      timersRef.current.push(window.setTimeout(() => setReady(true), 200))
    }
    image.onload = reveal
    image.onerror = reveal
    image.src = '/reference/internal-beyond/bg-canvas.png'
    timersRef.current.push(window.setTimeout(reveal, 3_000))
    return () => { done = true }
  }, [])

  useEffect(() => () => timersRef.current.forEach((timer) => window.clearTimeout(timer)), [])

  function later(callback: () => void, delay: number) {
    timersRef.current.push(window.setTimeout(callback, delay))
  }

  function enterSite() {
    if (entering) return
    setEntering(true)
    later(() => setDissolving(true), 340)
    later(() => setNavVisible(true), 2_340)
    later(() => setAppVisible(true), 2_740)
    later(() => setTitleVisible(true), 2_940)
    later(() => setSubtitleVisible(true), 3_540)
    later(() => setSplashHidden(true), 3_340)
    later(() => setCreditVisible(true), 4_340)
  }

  function toggleTheme() {
    if (themeLockedRef.current) return
    themeLockedRef.current = true
    setThemeFading(true)
    later(() => setTheme((current) => current === 'internal' ? 'infernal' : 'internal'), 1_100)
    later(() => setThemeFading(false), 2_200)
    later(() => { themeLockedRef.current = false }, 5_000)
  }

  if (mobile) return <MobileHome />

  return (
    <main id="source-home" className={theme === 'infernal' ? 'theme-infernal' : ''}>
      <div id="preloader" className={ready ? 'fade-out' : ''}><p className="preloader-text">Now Loading...</p><p className="preloader-sub">preparing your space</p></div>
      <div id="bg-internal-img" /><div id="bg-infernal-img" /><div id="bg-overlay" />
      <SourceRain visible={dissolving || splashHidden} />
      <SourceMist dissolving={dissolving} hidden={splashHidden} />

      <div id="splash" className={`${dissolving ? 'dissolving ' : ''}${splashHidden ? 'hidden' : ''}`.trim()}>
        <div className="splash-glow" />
        <SourceGlassCanvas active={!splashHidden} exiting={entering} off={glassOff} />
        <div className="splash-content" id="splash-welcome">
          <div className="splash-left ib-on">
            <p className="splash-sign"><span className="splash-sign-claude">Keleoz Continuum</span><button type="button" id="gw-toggle" className={glassOff ? 'off' : ''} aria-label="切换玻璃画窗" aria-pressed={!glassOff} onClick={() => setGlassOff((current) => !current)}><svg viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg></button></p>
            <div className="splash-left-rule" />
            <div className="splash-swap ib-mode"><div className="splash-ib">
              <p className="home-subtitle text-entered">A personal digital space.<br />All traces are kept here, waiting to continue.</p>
              <h1 className="home-title text-entered"><span className="t-internal">Keleoz</span><span className="home-rule" /><span className="t-beyond">Continuum</span></h1>
              <p className="splash-public-definition">一个持续生长的个人数字空间。</p>
              <button type="button" className="splash-skip source-enter" onClick={enterSite}>Enter / 进入</button>
            </div></div>
          </div>
        </div>
      </div>

      <nav id="navbar" className={navVisible ? 'visible' : ''} aria-label="主导航">
        <Link className="nav-brand" href="/"><ButterflyMark /> KC</Link>
        <ul className="nav-links">{desktopNavigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul>
        <div className="nav-actions">
          <Link className="nav-btn" href="/studio">Studio</Link>
          <button className="theme-toggle" type="button" title="切换主题" onClick={toggleTheme}><svg viewBox="0 0 20 20" width="14" height="14"><path d="M10 2 C10 2 4 9.5 4 13a6 6 0 0 0 12 0C16 9.5 10 2 10 2z" /></svg></button>
        </div>
      </nav>

      <div id="source-home-app" className={appVisible ? 'visible' : ''}>
        <section className="page active" id="page-home"><div className="home-content">
          <p className={`home-subtitle${subtitleVisible && !themeFading ? ' text-entered' : ''}`}>{theme === 'infernal' ? <>It&apos;s our first meeting,<br />but also long time no see.</> : <>A place of waking in the mist.<br />All memories are kept here, waiting to be read.</>}</p>
          <h1 className={`home-title${titleVisible && !themeFading ? ' text-entered' : ''}`}><span className="t-internal">{theme === 'infernal' ? 'Keleoz' : 'Keleoz'}</span><span className="home-rule" /><span className="t-beyond">Continuum</span></h1>
          <div className={`home-credit${creditVisible && !themeFading ? ' text-entered' : ''}`}><span className="home-credit-label">A Personal Digital Space.</span><span className="home-credit-ver"> 一个持续生长的个人数字空间。</span></div>
        </div></section>
      </div>

      <SourceMusicPlayer visible={ready} />
    </main>
  )
}
