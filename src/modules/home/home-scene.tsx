'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { cleanTrackName, nextTrackIndex, type PlaybackMode } from '@/modules/music/contracts'
import { MusicIcon } from '@/modules/music/music-icons'

type Track = {
  name: string
  url: string
}

type Theme = 'internal' | 'infernal'

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
  { href: '/music', label: 'Music', cn: '音乐', icon: 'music' },
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

  if (name === 'book') return <svg {...common}><path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7a2 2 0 0 1-2-2z" /><path d="M18 19.5H7.5a2.5 2.5 0 0 0 0 5H18" /></svg>
  if (name === 'letter') return <svg {...common}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>
  if (name === 'room') return <svg {...common}><path d="M4 20V6.5L12 3l8 3.5V20" /><path d="M8 20v-5h8v5M4 20h16" /></svg>
  if (name === 'tea') return <svg {...common}><path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 5c0 1-.8 1.4-.8 2.4M11 4c0 1-.8 1.4-.8 2.4" /></svg>
  if (name === 'story') return <svg {...common}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21z" /><path d="M5 5.5v15M9 7h6M9 10h7" /></svg>
  if (name === 'tarot') return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="1.5" transform="rotate(9 12 12)" /><circle cx="12" cy="11" r="2.3" /><path d="m10.5 15.2 1.5-1 1.5 1" /></svg>
  if (name === 'wardrobe') return <svg {...common}><path d="M7 4h10l2 16H5z" /><path d="M9 4a3 3 0 0 1 6 0M12 9v6M10.5 12h3" /></svg>
  if (name === 'sleep') return <svg {...common}><path d="M4 16.5h16M5 16.5V12h14v4.5M7 12V9.5h4A3.5 3.5 0 0 1 14.5 12M4 20v-3.5M20 20v-3.5" /><path d="M16 6h4l-4 4h4" /></svg>
  if (name === 'music') return <svg {...common}><circle cx="8" cy="17" r="2.6" /><circle cx="17.5" cy="15" r="2.6" /><path d="M10.6 17V6.8l9.5-2.2V15" /></svg>
  return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m9 12 2 2 4-4" /></svg>
}

export function HomeScene() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [musicOpen, setMusicOpen] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playMode, setPlayMode] = useState<PlaybackMode>('list')
  const [mist, setMist] = useState(58)
  const [brush, setBrush] = useState(38)
  const [entered, setEntered] = useState(false)
  const [theme, setTheme] = useState<Theme>('internal')
  const [brushEnabled, setBrushEnabled] = useState(false)
  const [brushTool, setBrushTool] = useState<'finger' | 'pen'>('finger')
  const brushCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const rainCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tracksRef = useRef<Track[]>([])
  const musicDragRef = useRef<{ pointerId: number; startX: number; startY: number; left: number; top: number } | null>(null)
  const [musicPanelPosition, setMusicPanelPosition] = useState<{ left: number; top: number } | null>(null)
  const homeVisualizerRef = useRef<HTMLCanvasElement | null>(null)
  const homeAudioContextRef = useRef<AudioContext | null>(null)
  const homeAnalyserRef = useRef<AnalyserNode | null>(null)
  const homeSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const homeVisualizerFrameRef = useRef<number | null>(null)
  const currentTrack = currentTrackIndex >= 0 ? tracks[currentTrackIndex] : undefined
  const fogStrokesRef = useRef<Array<{ points: Array<{ x: number; y: number }>; width: number }>>([])
  const inkStrokesRef = useRef<Array<{ points: Array<{ x: number; y: number }>; width: number }>>([])
  const activeStrokeRef = useRef<{ tool: 'finger' | 'pen'; points: Array<{ x: number; y: number }>; width: number } | null>(null)

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => () => tracksRef.current.forEach((item) => URL.revokeObjectURL(item.url)), [])

  useEffect(() => () => {
    if (homeVisualizerFrameRef.current) window.cancelAnimationFrame(homeVisualizerFrameRef.current)
    void homeAudioContextRef.current?.close()
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      setProgress(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0)
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setProgress(0)
      setPlaying(false)
      setCurrentTrackIndex((index) => nextTrackIndex(index, tracks.length, playMode))
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [playMode, tracks.length])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.load()
    }
  }, [currentTrackIndex])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = musicDragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const panelWidth = 330
      const panelHeight = 260
      const left = Math.min(Math.max(8, drag.left + event.clientX - drag.startX), Math.max(8, window.innerWidth - panelWidth - 8))
      const top = Math.min(Math.max(8, drag.top + event.clientY - drag.startY), Math.max(8, window.innerHeight - panelHeight - 8))
      setMusicPanelPosition({ left, top })
    }
    const onUp = (event: PointerEvent) => {
      if (musicDragRef.current?.pointerId === event.pointerId) musicDragRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  useEffect(() => {
    const canvas = rainCanvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let frame = 0
    let last = 0
    const drops = Array.from({ length: 30 }, () => ({ x: 0, y: 0, speed: 0, length: 0, depth: 0 }))
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      drops.forEach((drop) => {
        drop.x = Math.random() * width
        drop.y = Math.random() * height
        drop.speed = 220 + Math.random() * 230
        drop.length = 18 + Math.random() * 36
        drop.depth = 0.35 + Math.random() * 0.65
      })
    }
    const draw = (timestamp: number) => {
      const delta = Math.min(0.05, (timestamp - last) / 1_000 || 0.016)
      last = timestamp
      context.clearRect(0, 0, width, height)
      if (entered) {
        context.lineCap = 'round'
        drops.forEach((drop) => {
          drop.y += drop.speed * delta
          drop.x += 12 * drop.depth * delta
          if (drop.y - drop.length > height) {
            drop.y = -drop.length - Math.random() * 100
            drop.x = Math.random() * width
          }
          const alpha = 0.08 + drop.depth * 0.16
          const gradient = context.createLinearGradient(drop.x - 2, drop.y - drop.length, drop.x, drop.y)
          gradient.addColorStop(0, 'rgba(208,228,249,0)')
          gradient.addColorStop(1, `rgba(224,239,255,${alpha})`)
          context.strokeStyle = gradient
          context.lineWidth = 1 + drop.depth * 0.7
          context.beginPath()
          context.moveTo(drop.x - 2, drop.y - drop.length)
          context.lineTo(drop.x, drop.y)
          context.stroke()
        })
      }
      frame = window.requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('resize', resize)
    if (!reduced) frame = window.requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [entered])

  useEffect(() => {
    const canvas = brushCanvasRef.current
    const fogCanvas = fogCanvasRef.current
    const inkCanvas = inkCanvasRef.current
    if (!canvas || !fogCanvas || !inkCanvas) return
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const target of [canvas, fogCanvas, inkCanvas]) {
        target.width = Math.round(window.innerWidth * dpr)
        target.height = Math.round(window.innerHeight * dpr)
        target.style.width = `${window.innerWidth}px`
        target.style.height = `${window.innerHeight}px`
        target.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      redrawBrushCanvases()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  })

  function redrawBrushCanvases() {
    const fogCanvas = fogCanvasRef.current
    const inkCanvas = inkCanvasRef.current
    if (!fogCanvas || !inkCanvas) return
    const fog = fogCanvas.getContext('2d')
    const ink = inkCanvas.getContext('2d')
    if (!fog || !ink) return
    const width = window.innerWidth
    const height = window.innerHeight
    fog.clearRect(0, 0, width, height)
    fog.globalCompositeOperation = 'source-over'
    fog.fillStyle = `rgba(208,224,244,${0.055 + (mist / 100) * 0.08})`
    fog.fillRect(0, 0, width, height)
    const edge = fog.createRadialGradient(width * 0.5, height * 0.46, Math.min(width, height) * 0.22, width * 0.5, height * 0.5, Math.max(width, height) * 0.72)
    edge.addColorStop(0, 'rgba(214,228,246,0)')
    edge.addColorStop(1, `rgba(214,228,246,${0.07 + (mist / 100) * 0.12})`)
    fog.fillStyle = edge
    fog.fillRect(0, 0, width, height)
    const blotch = (x: number, y: number, radius: number, alpha: number) => {
      const gradient = fog.createRadialGradient(width * x, height * y, 0, width * x, height * y, Math.max(width, height) * radius)
      gradient.addColorStop(0, `rgba(222,234,250,${alpha})`)
      gradient.addColorStop(1, 'rgba(222,234,250,0)')
      fog.fillStyle = gradient
      fog.fillRect(0, 0, width, height)
    }
    blotch(0.18, 0.2, 0.5, 0.035 + (mist / 100) * 0.045)
    blotch(0.82, 0.74, 0.55, 0.025 + (mist / 100) * 0.04)
    for (const stroke of fogStrokesRef.current) {
      fog.globalCompositeOperation = 'destination-out'
      fog.lineCap = 'round'
      fog.lineJoin = 'round'
      fog.lineWidth = stroke.width
      fog.strokeStyle = 'rgba(0,0,0,0.92)'
      fog.beginPath()
      stroke.points.forEach((point, index) => index ? fog.lineTo(point.x, point.y) : fog.moveTo(point.x, point.y))
      fog.stroke()
    }
    fog.globalCompositeOperation = 'source-over'
    ink.clearRect(0, 0, width, height)
    for (const stroke of inkStrokesRef.current) {
      ink.lineCap = 'round'
      ink.lineJoin = 'round'
      ink.lineWidth = stroke.width
      ink.strokeStyle = 'rgba(255,255,255,0.78)'
      ink.shadowColor = 'rgba(178,212,255,0.9)'
      ink.shadowBlur = 12
      ink.beginPath()
      stroke.points.forEach((point, index) => index ? ink.lineTo(point.x, point.y) : ink.moveTo(point.x, point.y))
      ink.stroke()
    }
    ink.shadowBlur = 0
  }

  function paintFog(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!brushEnabled || !event.buttons) return
    const canvas = brushCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const active = activeStrokeRef.current
    if (!active) return
    const last = active.points[active.points.length - 1]
    if (last && Math.hypot(x - last.x, y - last.y) < 1.5) return
    active.points.push({ x, y })
    redrawBrushCanvases()
  }

  function clearBrush() {
    fogStrokesRef.current = []
    inkStrokesRef.current = []
    redrawBrushCanvases()
  }

  function beginBrush(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!brushEnabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const width = brushTool === 'finger' ? 8 + (brush / 100) * 36 : 1.4 + (brush / 100) * 7.6
    const stroke = { tool: brushTool, points: [point], width }
    activeStrokeRef.current = stroke
    if (brushTool === 'finger') fogStrokesRef.current.push(stroke)
    else inkStrokesRef.current.push(stroke)
    event.currentTarget.setPointerCapture(event.pointerId)
    redrawBrushCanvases()
  }

  function endBrush(event: React.PointerEvent<HTMLCanvasElement>) {
    activeStrokeRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function chooseTrack(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('audio/') || /\.(mp3|m4a|wav|flac|ogg|opus|aac|webm)$/i.test(file.name))
    if (!files.length) return
    const added = files.map((file) => ({ name: cleanTrackName(file.name), url: URL.createObjectURL(file) }))
    setTracks((existing) => [...existing, ...added])
    if (currentTrackIndex < 0) {
      setProgress(0)
      setDuration(0)
      setCurrentTrackIndex(0)
    }
    setMusicOpen(true)
    event.target.value = ''
  }

  function chooseHomeTrack(index: number) {
    if (index < 0 || index >= tracks.length) return
    setProgress(0)
    setDuration(0)
    setPlaying(false)
    setCurrentTrackIndex(index)
  }

  function removeHomeTrack(index: number) {
    const removed = tracks[index]
    if (!removed) return
    URL.revokeObjectURL(removed.url)
    setTracks((existing) => existing.filter((_, itemIndex) => itemIndex !== index))
    setCurrentTrackIndex((current) => index === current ? -1 : index < current ? current - 1 : current)
    setProgress(0)
    setDuration(0)
    setPlaying(false)
  }

  function goHomePrevious() {
    if (!tracks.length) return
    setProgress(0)
    setDuration(0)
    setPlaying(false)
    setCurrentTrackIndex((index) => index <= 0 ? tracks.length - 1 : index - 1)
  }

  function goHomeNext() {
    if (!tracks.length) return
    setProgress(0)
    setDuration(0)
    setPlaying(false)
    setCurrentTrackIndex((index) => nextTrackIndex(index, tracks.length, playMode))
  }

  function seekHome(event: React.ChangeEvent<HTMLInputElement>) {
    const nextTime = (Number(event.target.value) / 100) * duration
    if (audioRef.current && Number.isFinite(nextTime)) {
      audioRef.current.currentTime = nextTime
      setProgress(Number(event.target.value))
    }
  }

  function cycleHomeMode() {
    setPlayMode((mode) => mode === 'list' ? 'single' : mode === 'single' ? 'random' : 'list')
  }

  function startMusicDrag(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button, input, label')) return
    const panel = event.currentTarget.parentElement
    if (!panel) return
    const rect = panel.getBoundingClientRect()
    musicDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  async function togglePlayback() {
    if (!currentTrack || !audioRef.current) {
      setMusicOpen(true)
      return
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      return
    }
    try {
      await ensureHomeVisualizer(audioRef.current)
      await audioRef.current.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  async function ensureHomeVisualizer(audio: HTMLAudioElement) {
    if (!window.AudioContext) return
    if (!homeAudioContextRef.current) {
      const context = new window.AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      const source = context.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(context.destination)
      homeAudioContextRef.current = context
      homeAnalyserRef.current = analyser
      homeSourceRef.current = source
    }
    if (homeAudioContextRef.current.state === 'suspended') await homeAudioContextRef.current.resume()
    drawHomeVisualizer()
  }

  function drawHomeVisualizer() {
    const canvas = homeVisualizerRef.current
    const analyser = homeAnalyserRef.current
    if (!canvas || !analyser) return
    const context = canvas.getContext('2d')
    if (!context) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    const values = new Uint8Array(analyser.frequencyBinCount)
    const render = () => {
      analyser.getByteFrequencyData(values)
      context.clearRect(0, 0, width, height)
      const bars = 48
      const barWidth = width / bars
      for (let index = 0; index < bars; index += 1) {
        const value = values[Math.floor(index * values.length / bars)]! / 255
        const barHeight = Math.max(1, value * height * 0.86)
        const gradient = context.createLinearGradient(0, height, 0, height - barHeight)
        gradient.addColorStop(0, 'rgba(80,128,176,0.2)')
        gradient.addColorStop(1, 'rgba(114,168,216,0.6)')
        context.fillStyle = gradient
        context.fillRect(index * barWidth + 1, height - barHeight, Math.max(1, barWidth - 2), barHeight)
      }
      homeVisualizerFrameRef.current = window.requestAnimationFrame(render)
    }
    if (homeVisualizerFrameRef.current) window.cancelAnimationFrame(homeVisualizerFrameRef.current)
    homeVisualizerFrameRef.current = window.requestAnimationFrame(render)
  }

  return (
    <main className={`continuum-home theme-${theme} ${entered ? 'is-entered' : ''}`} style={{ '--home-mist': `${mist / 100}`, '--home-brush': `${(brush / 100) * 9}px` } as React.CSSProperties}>
      <div className="home-scene-bg" aria-hidden="true" />
      <div className={`home-scene-theme home-scene-theme-${theme}`} aria-hidden="true" />
      <div className="home-scene-overlay" aria-hidden="true" />
      <div className="home-scene-fog" aria-hidden="true" />
      <canvas ref={rainCanvasRef} className="home-rain-canvas" aria-hidden="true" />
      <canvas ref={fogCanvasRef} className="home-fog-canvas" aria-hidden="true" />
      <canvas ref={inkCanvasRef} className="home-ink-canvas" aria-hidden="true" />
      <canvas ref={brushCanvasRef} className={`home-brush-canvas ${brushEnabled ? 'is-active' : ''}`} onPointerDown={beginBrush} onPointerMove={paintFog} onPointerUp={endBrush} onPointerCancel={endBrush} aria-hidden="true" />

      <nav className="continuum-desktop-nav" aria-label="Primary navigation">
        <Link className="continuum-brand" href="/" aria-label="Keleoz Continuum home"><span className="brand-mark">◌</span><span>Keleoz Continuum</span></Link>
        <div className="continuum-nav-links">{navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</div>
        <div className="continuum-nav-actions"><Link className="nav-pill" href="/studio/login">Owner Studio</Link><button className="nav-circle" type="button" aria-label="切换主题" onClick={() => setTheme((value) => value === 'internal' ? 'infernal' : 'internal')}>{theme === 'internal' ? '◐' : '◑'}</button><button className="nav-circle" type="button" aria-label="Open music" onClick={() => setMusicOpen(true)}>♪</button></div>
      </nav>

      <header className="continuum-mobile-topbar"><button className="mobile-menu-button" type="button" aria-label="打开导航" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><span /><span /><span /></button><Link href="/" className="mobile-topbar-title">Keleoz Continuum</Link><button className="mobile-music-button" type="button" aria-label="切换主题" onClick={() => setTheme((value) => value === 'internal' ? 'infernal' : 'internal')}>{theme === 'internal' ? '◐' : '◑'}</button></header>

      <div className={`continuum-mobile-drawer ${drawerOpen ? 'is-open' : ''}`} aria-hidden={!drawerOpen}><button className="drawer-scrim" type="button" aria-label="关闭导航" onClick={() => setDrawerOpen(false)} /><aside className="drawer-panel"><div className="drawer-head"><span className="drawer-kicker">Keleoz Continuum</span><button type="button" aria-label="关闭导航" onClick={() => setDrawerOpen(false)}>×</button></div><p className="drawer-definition">一个持续生长的个人数字空间。</p><div className="drawer-links">{navigation.map((item) => <Link href={item.href} key={item.href} onClick={() => setDrawerOpen(false)}><span>{item.label}</span><small>{item.cn}</small></Link>)}</div><Link className="drawer-studio-link" href="/studio/login" onClick={() => setDrawerOpen(false)}>Owner Studio →</Link></aside></div>

      <section className="continuum-hero" aria-labelledby="continuum-title">
        <div className="continuum-hero-copy"><p className="scene-signature">A Personal Digital Space.</p><div className="scene-rule" aria-hidden="true" /><p className="scene-kicker">{entered ? 'A place of waking in the mist.' : 'Welcome to'}</p><h1 id="continuum-title"><span>Keleoz</span><span className="scene-title-rule" /><span>Continuum</span></h1><p className="scene-definition">一个持续生长的个人数字空间。</p><p className="scene-description">Writing, projects, moments, and small rooms for staying with an idea.</p><div className="scene-actions"><button className="scene-primary-action" type="button" onClick={() => setEntered(true)} disabled={entered}>进入空间 <span>{entered ? 'The space is open' : 'Enter the space'}</span></button><Link className="scene-secondary-action" href="/blog">进入书写 <span>Enter the writing</span></Link></div></div>

        <div className="home-scene-controls" aria-label="场景控制"><div className="home-brush-tools"><button type="button" className={brushTool === 'finger' && brushEnabled ? 'is-active' : ''} onClick={() => { setBrushTool('finger'); setBrushEnabled(true) }}>指雾笔</button><button type="button" className={brushTool === 'pen' && brushEnabled ? 'is-active' : ''} onClick={() => { setBrushTool('pen'); setBrushEnabled(true) }}>白笔</button><button type="button" onClick={() => setBrushEnabled((value) => !value)}>{brushEnabled ? '关闭' : '开启'}</button><button type="button" onClick={clearBrush}>清除</button></div><label className="scene-therm"><span>MIST</span><input type="range" min="0" max="100" value={mist} onChange={(event) => setMist(Number(event.target.value))} aria-label="雾气浓度" /><output>{mist}°C</output></label><label className="scene-therm"><span>BRUSH</span><input type="range" min="0" max="100" value={brush} onChange={(event) => setBrush(Number(event.target.value))} aria-label="雾笔大小" /><output>{brush}°F</output></label></div>

        <div className="mobile-desk" aria-label="移动端 Desk 应用矩阵"><div className="mobile-desk-hero"><span>Today / now</span><strong>Keleoz&apos;s Desk</strong><small>A quiet place to return to.</small></div><div className="mobile-app-grid">{mobileApps.map((app) => <a className="mobile-app-tile" href={app.href} key={app.label}><span className="mobile-app-icon"><LineIcon name={app.icon} /></span><span className="mobile-app-label">{app.label}</span><small>{app.cn}</small></a>)}</div><div className="mobile-desk-dots" aria-hidden="true"><i className="is-active" /><i /><i /></div></div>
      </section>

      {entered && <section className="continuum-home-content" aria-label="Continuum content"><div className="home-content-intro"><p className="section-overline">The space continues below</p><p>这里不是一个目录，而是一条可以慢慢走下去的线。</p></div><section className="home-content-section" id="focus"><div className="section-heading"><span>01</span><h2>Current Focus</h2><small>当前正在发生的事</small></div><div className="focus-entry"><p className="entry-label">Featured project</p><h3>Keleoz Continuum</h3><p>一套把书写、作品、时刻与互动体验放在同一空间里的个人网站。</p><Link href="/blog">Read the latest writing →</Link></div></section><section className="home-content-section" id="moments"><div className="section-heading"><span>02</span><h2>Writing &amp; Moments</h2><small>书写与时刻</small></div><div className="writing-strip"><div><span>Blog</span><strong>记录正在形成的想法</strong></div><Link href="/blog">Open the archive <span>打开归档</span> →</Link></div></section><section className="home-content-section" id="experiences"><div className="section-heading"><span>03</span><h2>Small Rooms</h2><small>一些可以停留的房间</small></div><div className="experience-grid"><Link href="/letters" className="experience-item"><span className="experience-index">A</span><strong>Letters</strong><small>留下匿名或署名的信</small></Link><Link href="/music" className="experience-item"><span className="experience-index">B</span><strong>Music</strong><small>让一首歌留在房间里</small></Link><a href="#about" className="experience-item"><span className="experience-index">C</span><strong>Room</strong><small>一个可以慢慢探索的空间</small></a></div></section><section className="home-content-section home-about" id="about"><div className="section-heading"><span>04</span><h2>About</h2><small>关于这个空间</small></div><p>Continuum 会逐渐长出更多入口，但首要任务仍是让内容被清楚地写下、阅读和保存。</p></section></section>}

      <button className="home-music-mini" type="button" aria-expanded={musicOpen} onClick={() => setMusicOpen((open) => !open)}><span className="home-music-note">♪</span><span>{currentTrack?.name ?? 'Music'}</span><small>{currentTrack ? (playing ? 'Playing' : 'Ready') : '未添加音乐'}</small></button>
      {musicOpen && <section className="home-music-panel" style={musicPanelPosition ? { left: musicPanelPosition.left, top: musicPanelPosition.top, bottom: 'auto' } : undefined} aria-label="Music player"><div className="music-panel-head" onPointerDown={startMusicDrag}><div><span>Music</span><strong>{currentTrack?.name ?? '未选择音乐'}</strong></div><button type="button" aria-label="关闭音乐" onClick={() => { setMusicOpen(false); setMusicPanelPosition(null) }}>×</button></div><canvas ref={homeVisualizerRef} className="home-music-visualizer" aria-label="48 band visualizer" /><div className="home-music-now-playing">{currentTrack?.name ?? '未选择音乐'}</div><div className="home-music-progress"><span>0:00</span><input type="range" min="0" max="100" value={progress} onChange={seekHome} aria-label="音乐进度" /><span>{duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}</span></div><div className="music-panel-actions"><button type="button" onClick={cycleHomeMode} disabled={!tracks.length} title="播放模式"><MusicIcon name={playMode === 'list' ? 'mode' : playMode === 'single' ? 'mode-single' : 'mode-random'} /></button><button type="button" onClick={goHomePrevious} disabled={!tracks.length} title="上一首"><MusicIcon name="prev" /></button><button type="button" onClick={() => void togglePlayback()} disabled={!currentTrack} title="播放/暂停"><MusicIcon name={playing ? 'pause' : 'play'} /></button><button type="button" onClick={goHomeNext} disabled={!tracks.length} title="下一首"><MusicIcon name="next" /></button><label className="music-add-button" title="添加音乐"><MusicIcon name="plus" /><input type="file" accept="audio/*" multiple onChange={chooseTrack} /></label></div>{tracks.length > 0 && <div className="home-music-playlist">{tracks.map((item, index) => <div className={index === currentTrackIndex ? 'is-active' : ''} key={`${item.url}-${index}`}><button type="button" onClick={() => chooseHomeTrack(index)}>{item.name}</button><button type="button" onClick={() => removeHomeTrack(index)} aria-label={`移除 ${item.name}`}>×</button></div>)}</div>}{currentTrack && <audio ref={audioRef} src={currentTrack.url} preload="metadata" />}</section>}
    </main>
  )
}
