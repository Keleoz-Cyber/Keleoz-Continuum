'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Track = {
  name: string
  url: string
}

const navigation = [
  { href: '#focus', label: 'Focus', cn: '当前' },
  { href: '/blog', label: 'Blog', cn: '书写' },
  { href: '#moments', label: 'Moments', cn: '时刻' },
  { href: '#experiences', label: 'Experience', cn: '体验' },
  { href: '/letters', label: 'Letters', cn: '信箱' },
  { href: '#about', label: 'About', cn: '关于' },
]

const mobileApps = [
  { href: '/blog', label: 'Blog', cn: '日志', icon: 'book' },
  { href: '/letters', label: 'Letters', cn: '信箱', icon: 'letter' },
  { href: '#experiences', label: 'Room', cn: '房间', icon: 'room' },
  { href: '#experiences', label: 'Tea', cn: '茶室', icon: 'tea' },
  { href: '#experiences', label: 'Story', cn: '故事', icon: 'story' },
  { href: '#experiences', label: 'Tarot', cn: '塔罗', icon: 'tarot' },
  { href: '#experiences', label: 'Wardrobe', cn: '衣橱', icon: 'wardrobe' },
  { href: '#experiences', label: 'Sleep', cn: '睡眠', icon: 'sleep' },
]

function LineIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.45,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'book') {
    return <svg {...common}><path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7a2 2 0 0 1-2-2z" /><path d="M18 19.5H7.5a2.5 2.5 0 0 0 0 5H18" /></svg>
  }
  if (name === 'letter') {
    return <svg {...common}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>
  }
  if (name === 'room') {
    return <svg {...common}><path d="M4 20V6.5L12 3l8 3.5V20" /><path d="M8 20v-5h8v5M4 20h16" /></svg>
  }
  if (name === 'tea') {
    return <svg {...common}><path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 5c0 1-.8 1.4-.8 2.4M11 4c0 1-.8 1.4-.8 2.4" /></svg>
  }
  if (name === 'story') {
    return <svg {...common}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21z" /><path d="M5 5.5v15M9 7h6M9 10h7" /></svg>
  }
  if (name === 'tarot') {
    return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="1.5" transform="rotate(9 12 12)" /><circle cx="12" cy="11" r="2.3" /><path d="m10.5 15.2 1.5-1 1.5 1" /></svg>
  }
  if (name === 'wardrobe') {
    return <svg {...common}><path d="M7 4h10l2 16H5z" /><path d="M9 4a3 3 0 0 1 6 0M12 9v6M10.5 12h3" /></svg>
  }
  if (name === 'sleep') {
    return <svg {...common}><path d="M4 16.5h16M5 16.5V12h14v4.5M7 12V9.5h4A3.5 3.5 0 0 1 14.5 12M4 20v-3.5M20 20v-3.5" /><path d="M16 6h4l-4 4h4" /></svg>
  }
  return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m9 12 2 2 4-4" /></svg>
}

export function HomeScene() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [musicOpen, setMusicOpen] = useState(false)
  const [track, setTrack] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [mist, setMist] = useState(58)
  const [brush, setBrush] = useState(38)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (track) URL.revokeObjectURL(track.url)
    }
  }, [track])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => setPlaying(false)
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [track])

  function chooseTrack(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (track) URL.revokeObjectURL(track.url)
    setTrack({ name: file.name, url: URL.createObjectURL(file) })
    setPlaying(false)
    setMusicOpen(true)
  }

  async function togglePlayback() {
    if (!track || !audioRef.current) {
      setMusicOpen(true)
      return
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      return
    }
    await audioRef.current.play()
    setPlaying(true)
  }

  return (
    <main
      className="continuum-home"
      style={{
        '--home-mist': `${mist / 100}`,
        '--home-brush': `${(brush / 100) * 9}px`,
      } as React.CSSProperties}
    >
      <div className="home-scene-bg" aria-hidden="true" />
      <div className="home-scene-overlay" aria-hidden="true" />
      <div className="home-scene-fog" aria-hidden="true" />

      <nav className="continuum-desktop-nav" aria-label="Primary navigation">
        <Link className="continuum-brand" href="/" aria-label="Keleoz Continuum home">
          <span className="brand-mark">◌</span>
          <span>Keleoz Continuum</span>
        </Link>
        <div className="continuum-nav-links">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </div>
        <div className="continuum-nav-actions">
          <Link className="nav-pill" href="/studio/login">Owner Studio</Link>
          <button className="nav-circle" type="button" aria-label="Open music" onClick={() => setMusicOpen(true)}>♪</button>
        </div>
      </nav>

      <header className="continuum-mobile-topbar">
        <button className="mobile-menu-button" type="button" aria-label="打开导航" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <span /><span /><span />
        </button>
        <Link href="/" className="mobile-topbar-title">Keleoz Continuum</Link>
        <button className="mobile-music-button" type="button" aria-label="打开音乐" onClick={() => setMusicOpen(true)}>♪</button>
      </header>

      <div className={`continuum-mobile-drawer ${drawerOpen ? 'is-open' : ''}`} aria-hidden={!drawerOpen}>
        <button className="drawer-scrim" type="button" aria-label="关闭导航" onClick={() => setDrawerOpen(false)} />
        <aside className="drawer-panel">
          <div className="drawer-head">
            <span className="drawer-kicker">Keleoz Continuum</span>
            <button type="button" aria-label="关闭导航" onClick={() => setDrawerOpen(false)}>×</button>
          </div>
          <p className="drawer-definition">一个持续生长的个人数字空间。</p>
          <div className="drawer-links">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href} onClick={() => setDrawerOpen(false)}>
                <span>{item.label}</span><small>{item.cn}</small>
              </Link>
            ))}
          </div>
          <Link className="drawer-studio-link" href="/studio/login" onClick={() => setDrawerOpen(false)}>Owner Studio →</Link>
        </aside>
      </div>

      <section className="continuum-hero" aria-labelledby="continuum-title">
        <div className="continuum-hero-copy">
          <p className="scene-signature">A Personal Digital Space.</p>
          <div className="scene-rule" aria-hidden="true" />
          <p className="scene-kicker">Welcome to</p>
          <h1 id="continuum-title"><span>Keleoz</span><span className="scene-title-rule" /><span>Continuum</span></h1>
          <p className="scene-definition">一个持续生长的个人数字空间。</p>
          <p className="scene-description">Writing, projects, moments, and small rooms for staying with an idea.</p>
          <div className="scene-actions">
            <Link className="scene-primary-action" href="/blog">进入书写 <span>Enter the writing</span></Link>
            <a className="scene-secondary-action" href="#experiences">探索空间 <span>Explore the space</span></a>
          </div>
        </div>

        <div className="home-scene-controls" aria-label="场景控制">
          <label className="scene-therm">
            <span>MIST</span>
            <input type="range" min="0" max="100" value={mist} onChange={(event) => setMist(Number(event.target.value))} aria-label="雾气浓度" />
            <output>{mist}°C</output>
          </label>
          <label className="scene-therm">
            <span>BRUSH</span>
            <input type="range" min="0" max="100" value={brush} onChange={(event) => setBrush(Number(event.target.value))} aria-label="雾笔大小" />
            <output>{brush}°F</output>
          </label>
        </div>

        <div className="mobile-desk" aria-label="移动端 Desk 应用矩阵">
          <div className="mobile-desk-hero">
            <span>Today / now</span>
            <strong>Keleoz&apos;s Desk</strong>
            <small>A quiet place to return to.</small>
          </div>
          <div className="mobile-app-grid">
            {mobileApps.map((app) => (
              <a className="mobile-app-tile" href={app.href} key={app.label}>
                <span className="mobile-app-icon"><LineIcon name={app.icon} /></span>
                <span className="mobile-app-label">{app.label}</span>
                <small>{app.cn}</small>
              </a>
            ))}
          </div>
          <div className="mobile-desk-dots" aria-hidden="true"><i className="is-active" /><i /><i /></div>
        </div>
      </section>

      <section className="continuum-home-content" aria-label="Continuum content">
        <div className="home-content-intro">
          <p className="section-overline">The space continues below</p>
          <p>这里不是一个目录，而是一条可以慢慢走下去的线。</p>
        </div>
        <section className="home-content-section" id="focus">
          <div className="section-heading"><span>01</span><h2>Current Focus</h2><small>当前正在发生的事</small></div>
          <div className="focus-entry"><p className="entry-label">Featured project</p><h3>Keleoz Continuum</h3><p>一套把书写、作品、时刻与互动体验放在同一空间里的个人网站。</p><Link href="/blog">Read the latest writing →</Link></div>
        </section>
        <section className="home-content-section" id="moments">
          <div className="section-heading"><span>02</span><h2>Writing & Moments</h2><small>书写与时刻</small></div>
          <div className="writing-strip"><div><span>Blog</span><strong>记录正在形成的想法</strong></div><Link href="/blog">Open the archive <span>打开归档</span> →</Link></div>
        </section>
        <section className="home-content-section" id="experiences">
          <div className="section-heading"><span>03</span><h2>Small Rooms</h2><small>一些可以停留的房间</small></div>
          <div className="experience-grid">
            <Link href="/letters" className="experience-item"><span className="experience-index">A</span><strong>Letters</strong><small>留下匿名或署名的信</small></Link>
            <button type="button" className="experience-item" onClick={() => setMusicOpen(true)}><span className="experience-index">B</span><strong>Music</strong><small>让一首歌留在房间里</small></button>
            <a href="#about" className="experience-item"><span className="experience-index">C</span><strong>Room</strong><small>一个可以慢慢探索的空间</small></a>
          </div>
        </section>
        <section className="home-content-section home-about" id="about">
          <div className="section-heading"><span>04</span><h2>About</h2><small>关于这个空间</small></div>
          <p>Continuum 会逐渐长出更多入口，但首要任务仍是让内容被清楚地写下、阅读和保存。</p>
        </section>
      </section>

      <button className="home-music-mini" type="button" aria-expanded={musicOpen} onClick={() => setMusicOpen((open) => !open)}>
        <span className="home-music-note">♪</span><span>{track?.name ?? 'Music'}</span><small>{track ? (playing ? 'Playing' : 'Ready') : '未添加音乐'}</small>
      </button>
      {musicOpen && (
        <section className="home-music-panel" aria-label="Music player">
          <div className="music-panel-head"><div><span>Music</span><strong>{track?.name ?? '未选择音乐'}</strong></div><button type="button" aria-label="关闭音乐" onClick={() => setMusicOpen(false)}>×</button></div>
          <div className="music-panel-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="music-panel-actions"><button type="button" onClick={() => void togglePlayback()} disabled={!track}>{playing ? 'Pause' : 'Play'}</button><label className="music-add-button">Add music<input type="file" accept="audio/*" onChange={chooseTrack} /></label></div>
          {track && <audio ref={audioRef} src={track.url} preload="metadata" />}
        </section>
      )}
    </main>
  )
}
