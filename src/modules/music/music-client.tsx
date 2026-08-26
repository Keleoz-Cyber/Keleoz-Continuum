'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cleanTrackName, nextTrackIndex, parseLrc, type PlaybackMode } from '@/modules/music/contracts'
import { MusicIcon } from '@/modules/music/music-icons'

type LyricSegment = { start: number; text: string }

type Track = {
  id: string
  name: string
  url: string
  lyrics: LyricSegment[]
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '--:--'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function currentLyricIndex(segments: LyricSegment[], time: number): number {
  let index = -1
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i]!.start <= time) index = i
    else break
  }
  return index
}

export function MusicClient() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<PlaybackMode>('list')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [queueOpen, setQueueOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tracksRef = useRef<Track[]>([])
  const visualizerRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const visualizerFrameRef = useRef<number | null>(null)

  const current = currentIndex >= 0 ? tracks[currentIndex] : undefined
  const lyricIndex = current ? currentLyricIndex(current.lyrics, time) : -1
  const progress = duration > 0 ? Math.min(100, Math.max(0, (time / duration) * 100)) : 0

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      setTime(audio.currentTime)
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onEnded = () => {
      setPlaying(false)
      setTime(0)
      setDuration(0)
      setCurrentIndex(nextTrackIndex(currentIndex, tracks.length, mode))
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
  }, [currentIndex, mode, tracks.length])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.load()
    }
  }, [currentIndex])

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    return () => tracksRef.current.forEach((track) => URL.revokeObjectURL(track.url))
  }, [])

  useEffect(() => {
    return () => {
      if (visualizerFrameRef.current) window.cancelAnimationFrame(visualizerFrameRef.current)
      void audioContextRef.current?.close()
    }
  }, [])

  const visibleLyrics = useMemo(() => current?.lyrics.slice(Math.max(0, lyricIndex - 3), lyricIndex + 5) ?? [], [current, lyricIndex])

  async function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const audioFiles = files.filter((file) => file.type.startsWith('audio/') || /\.(mp3|m4a|wav|flac|ogg|opus|aac|webm)$/i.test(file.name))
    const lyricFiles = files.filter((file) => /\.(lrc|srt|vtt)$/i.test(file.name))
    const lyricByName = new Map<string, LyricSegment[]>()
    await Promise.all(lyricFiles.map(async (file) => {
      const segments = parseLrc(await file.text())
      lyricByName.set(cleanTrackName(file.name).toLowerCase(), segments)
    }))
    const added = audioFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: cleanTrackName(file.name),
      url: URL.createObjectURL(file),
      lyrics: lyricByName.get(cleanTrackName(file.name).toLowerCase()) ?? [],
    }))
    if (added.length) {
      setTracks((existing) => [...existing, ...added])
      if (currentIndex < 0) {
        setTime(0)
        setDuration(0)
        setCurrentIndex(0)
      }
    }
    event.target.value = ''
  }

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio || !current) return
    if (audio.paused) {
      try {
        await ensureVisualizer(audio)
        await audio.play()
      } catch { setPlaying(false) }
    } else {
      audio.pause()
    }
  }

  async function ensureVisualizer(audio: HTMLAudioElement) {
    const AudioContextConstructor = window.AudioContext
    if (!AudioContextConstructor) return
    if (!audioContextRef.current) {
      const context = new AudioContextConstructor()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      const source = context.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(context.destination)
      audioContextRef.current = context
      analyserRef.current = analyser
      sourceRef.current = source
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume()
    drawVisualizer()
  }

  function drawVisualizer() {
    const canvas = visualizerRef.current
    const analyser = analyserRef.current
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
      const barCount = 48
      const barWidth = width / barCount
      for (let index = 0; index < barCount; index += 1) {
        const value = values[Math.floor(index * values.length / barCount)]! / 255
        const barHeight = Math.max(1, value * height * 0.86)
        const gradient = context.createLinearGradient(0, height, 0, height - barHeight)
        gradient.addColorStop(0, 'rgba(108,151,205,0.18)')
        gradient.addColorStop(1, 'rgba(216,235,255,0.82)')
        context.fillStyle = gradient
        context.fillRect(index * barWidth + 1, height - barHeight, Math.max(1, barWidth - 2), barHeight)
      }
      visualizerFrameRef.current = window.requestAnimationFrame(render)
    }
    if (visualizerFrameRef.current) window.cancelAnimationFrame(visualizerFrameRef.current)
    visualizerFrameRef.current = window.requestAnimationFrame(render)
  }

  function chooseTrack(index: number) {
    if (index < 0 || index >= tracks.length) return
    setTime(0)
    setDuration(0)
    setPlaying(false)
    setCurrentIndex(index)
  }

  function goNext() {
    if (!tracks.length) return
    setTime(0)
    setDuration(0)
    setPlaying(false)
    setCurrentIndex((index) => nextTrackIndex(index, tracks.length, mode))
  }

  function goPrevious() {
    if (!tracks.length) return
    setTime(0)
    setDuration(0)
    setPlaying(false)
    setCurrentIndex((index) => (index <= 0 ? tracks.length - 1 : index - 1))
  }

  function seek(event: React.ChangeEvent<HTMLInputElement>) {
    const nextTime = (Number(event.target.value) / 100) * duration
    if (audioRef.current && Number.isFinite(nextTime)) {
      audioRef.current.currentTime = nextTime
      setTime(nextTime)
    }
  }

  function cycleMode() {
    setMode((value) => value === 'list' ? 'single' : value === 'single' ? 'random' : 'list')
  }

  function removeTrack(index: number) {
    const removed = tracks[index]
    if (!removed) return
    URL.revokeObjectURL(removed.url)
    setTracks((existing) => existing.filter((_, itemIndex) => itemIndex !== index))
    setTime(0)
    setDuration(0)
    setPlaying(false)
    setCurrentIndex((currentItem) => {
      if (index === currentItem) return -1
      if (index < currentItem) return currentItem - 1
      return currentItem
    })
  }

  return (
    <main className={`music-page ${playing ? 'is-playing' : ''}`}>
      <div className="music-page-bg" aria-hidden="true" />
      <div className="music-page-scrim" aria-hidden="true" />
      <header className="music-page-head">
        <Link className="music-back" href="/" aria-label="返回 Continuum">‹ <span>Continuum</span></Link>
        <div className="music-page-title">Music <small>音乐</small></div>
        <div className="music-page-actions"><button type="button" onClick={() => inputRef.current?.click()} aria-label="添加音乐或歌词"><MusicIcon name="plus" /></button><button type="button" onClick={() => setQueueOpen((open) => !open)} aria-expanded={queueOpen} aria-label="播放队列"><MusicIcon name="queue" /></button></div>
      </header>

      <section className="music-page-body" aria-label="Music player">
        <div className="music-art-stage">
          <div className="music-tonearm" aria-hidden="true"><i /></div>
          <div className="music-vinyl" aria-label={current?.name ?? '未选择音乐'}><div className="music-vinyl-label">{current ? '♪' : 'C'}</div></div>
        </div>
        <div className="music-track-info"><h1>{current?.name ?? 'Music'}</h1><p>{current ? 'Local listening · 本地播放' : 'Add a track to begin · 添加一首音乐开始'}</p></div>
        <div className="music-visualizer" aria-label="48 band visualizer"><canvas ref={visualizerRef} /></div>
        <div className="music-lyrics" aria-live="polite">
          {current?.lyrics.length ? visibleLyrics.map((line) => <p className={current.lyrics.indexOf(line) === lyricIndex ? 'is-current' : ''} key={`${line.start}-${line.text}`}>{line.text}</p>) : <p className="music-lyrics-empty">歌词会在选择 .lrc / .srt / .vtt 文件后显示。<br />Lyrics stay in this browser.</p>}
        </div>
      </section>

      <footer className="music-page-foot">
        <div className="music-progress-row"><span>{formatTime(time)}</span><input type="range" min="0" max="100" value={progress} onChange={seek} aria-label="播放进度" /><span>{formatTime(duration)}</span></div>
        <div className="music-controls"><button type="button" onClick={cycleMode} title={`播放模式：${mode}`}><MusicIcon name={mode === 'list' ? 'mode' : mode === 'single' ? 'mode-single' : 'mode-random'} /></button><button type="button" onClick={goPrevious} aria-label="上一首"><MusicIcon name="prev" /></button><button className="music-play" type="button" onClick={() => void togglePlayback()} aria-label={playing ? '暂停' : '播放'} disabled={!current}><MusicIcon name={playing ? 'pause' : 'play'} /></button><button type="button" onClick={goNext} aria-label="下一首"><MusicIcon name="next" /></button><button type="button" onClick={() => setQueueOpen((open) => !open)} aria-label="显示队列"><MusicIcon name="queue" /></button></div>
        <p className="music-local-note">Music files are kept in this browser only · 音乐只保存在当前浏览器</p>
      </footer>

      {queueOpen && <aside className="music-queue" aria-label="播放队列"><div className="music-queue-head"><span>Queue · 队列</span><button type="button" onClick={() => setQueueOpen(false)} aria-label="关闭队列">×</button></div>{tracks.length === 0 ? <p className="music-queue-empty">还没有加入音乐。</p> : <ol>{tracks.map((track, index) => <li className={index === currentIndex ? 'is-current' : ''} key={track.id}><button type="button" onClick={() => chooseTrack(index)}><span>{track.name}</span><small>{track.lyrics.length ? 'Lyrics' : 'Audio'}</small></button><button type="button" onClick={() => removeTrack(index)} aria-label={`移除 ${track.name}`}>×</button></li>)}</ol>}</aside>}
      <input ref={inputRef} type="file" accept="audio/*,.lrc,.srt,.vtt" multiple hidden onChange={(event) => void addFiles(event)} />
      <audio ref={audioRef} src={current?.url} preload="metadata" />
    </main>
  )
}
