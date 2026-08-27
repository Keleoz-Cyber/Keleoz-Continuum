'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cleanTrackName, nextTrackIndex, type PlaybackMode } from '@/modules/music/contracts'
import { MusicIcon } from '@/modules/music/music-icons'

type LocalTrack = {
  name: string
  url: string
}

const MODE_TITLES: Record<PlaybackMode, string> = {
  list: '列表循环',
  single: '单曲循环',
  random: '随机播放',
}

function modeIcon(mode: PlaybackMode) {
  if (mode === 'single') return 'mode-single' as const
  if (mode === 'random') return 'mode-random' as const
  return 'mode' as const
}

/** Source-extracted Desktop floating player; only the storage boundary is adapted. */
export function SourceMusicPlayer({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false)
  const [tracks, setTracks] = useState<LocalTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [mode, setMode] = useState<PlaybackMode>('list')
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const tracksRef = useRef<LocalTrack[]>([])
  const indexRef = useRef(-1)
  const modeRef = useRef<PlaybackMode>('list')
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const visualizerFrameRef = useRef(0)
  const playWhenReadyRef = useRef(false)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; left: number; top: number } | null>(null)
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : undefined

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    indexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => () => {
    tracksRef.current.forEach((track) => URL.revokeObjectURL(track.url))
    if (visualizerFrameRef.current) window.cancelAnimationFrame(visualizerFrameRef.current)
    void audioContextRef.current?.close()
  }, [])

  useEffect(() => {
    const audio = audioRef.current!
    if (!audio) return
    audio.load()
    setProgress(0)
    if (playWhenReadyRef.current && currentTrack) {
      playWhenReadyRef.current = false
      void audio.play()
    }
  }, [currentTrack])

  const playTrack = useCallback((index: number) => {
    if (index < 0 || index >= tracksRef.current.length) return
    playWhenReadyRef.current = true
    if (index === indexRef.current) {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        void audio.play()
      }
      return
    }
    setCurrentIndex(index)
  }, [])

  useEffect(() => {
    const audio = audioRef.current!
    if (!audio) return

    function onPlay() {
      setPlaying(true)
      const AudioContextClass = window.AudioContext
      if (!audioContextRef.current && AudioContextClass) {
        const audioContext = new AudioContextClass()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        const source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        sourceRef.current = source
      }
      void audioContextRef.current?.resume()
    }
    function onPause() {
      setPlaying(false)
    }
    function onTimeUpdate() {
      setProgress(audio.duration ? audio.currentTime / audio.duration * 100 : 0)
    }
    function onEnded() {
      const next = nextTrackIndex(indexRef.current, tracksRef.current.length, modeRef.current)
      if (next >= 0) playTrack(next)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [playTrack])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

    function resize() {
      if (!canvas || !context) return
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function draw() {
      if (!canvas || !context) return
      visualizerFrameRef.current = window.requestAnimationFrame(draw)
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      context.clearRect(0, 0, width, height)
      const analyser = analyserRef.current
      if (!analyser) return
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const bars = 48
      const barWidth = width / bars
      for (let index = 0; index < bars; index += 1) {
        const value = (data[Math.floor(index * data.length / bars)] ?? 0) / 255
        const barHeight = value * height * 0.85
        const gradient = context.createLinearGradient(0, height, 0, height - barHeight)
        gradient.addColorStop(0, 'rgba(80,128,176,0.2)')
        gradient.addColorStop(1, 'rgba(114,168,216,0.6)')
        context.fillStyle = gradient
        context.fillRect(index * barWidth + 1, height - barHeight, Math.max(0, barWidth - 2), barHeight)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    visualizerFrameRef.current = window.requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      if (visualizerFrameRef.current) window.cancelAnimationFrame(visualizerFrameRef.current)
    }
  }, [open])

  useEffect(() => {
    function move(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      const panelWidth = 300
      const panelHeight = 260
      setPosition({
        left: Math.max(8, Math.min(window.innerWidth - panelWidth - 8, drag.left + event.clientX - drag.startX)),
        top: Math.max(8, Math.min(window.innerHeight - panelHeight - 8, drag.top + event.clientY - drag.startY)),
      })
    }
    function up(event: PointerEvent) {
      if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  function beginDrag(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    const panel = event.currentTarget.closest<HTMLElement>('#music-panel')
    const rect = panel?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top }
    event.currentTarget.setPointerCapture(event.pointerId)
    setPosition({ left: rect.left, top: rect.top })
  }

  function addMusicFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('audio/'))
    if (!files.length) return
    const additions = files.map((file) => ({ name: cleanTrackName(file.name), url: URL.createObjectURL(file) }))
    const startIndex = tracksRef.current.length
    const nextTracks = [...tracksRef.current, ...additions]
    tracksRef.current = nextTracks
    setTracks(nextTracks)
    if (indexRef.current === -1) playTrack(startIndex)
    event.target.value = ''
  }

  function removeTrack(index: number) {
    const removed = tracksRef.current[index]
    if (!removed) return
    URL.revokeObjectURL(removed.url)
    const audio = audioRef.current
    const wasCurrent = index === indexRef.current
    if (wasCurrent) audio?.pause()
    const nextTracks = tracksRef.current.filter((_, trackIndex) => trackIndex !== index)
    tracksRef.current = nextTracks
    setTracks(nextTracks)
    if (!nextTracks.length) setCurrentIndex(-1)
    else if (wasCurrent) setCurrentIndex(Math.min(index, nextTracks.length - 1))
    else if (index < indexRef.current) setCurrentIndex((current) => current - 1)
  }

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio || indexRef.current < 0) return
    if (audio.paused) void audio.play()
    else audio.pause()
  }

  function seek(event: React.PointerEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio?.duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audio.duration
  }

  function cycleMode() {
    setMode((current) => current === 'list' ? 'single' : current === 'single' ? 'random' : 'list')
  }

  if (!visible) return null
  return (
    <>
      <button id="music-mini" className="visible" type="button" onClick={() => setOpen(true)} style={{ display: open ? 'none' : 'flex' }}>
        <span className="mini-icon">♪</span>
        <span className="mini-title">{currentTrack?.name ?? '未播放'}</span>
      </button>
      <section
        id="music-panel"
        className={`glass-card${open ? ' show' : ''}`}
        style={position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : undefined}
        aria-label="Music"
      >
        <div className="panel-header panel-drag-handle" onPointerDown={beginDrag}>
          <h4>Music</h4>
          <button className="panel-close" type="button" onClick={() => { setOpen(false); setPosition(null) }} aria-label="关闭音乐">✕</button>
        </div>
        <canvas id="visualizer-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="now-playing">{currentTrack?.name ?? '未选择音乐'}</div>
        <div className="progress-bar" onPointerDown={seek} role="slider" aria-label="音乐进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} tabIndex={0}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="player-controls">
          <button className="p-btn" type="button" title={MODE_TITLES[mode]} onClick={cycleMode}><MusicIcon name={modeIcon(mode)} size={13} /></button>
          <button className="p-btn" type="button" title="上一首" onClick={() => playTrack(currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1)} disabled={!tracks.length}><MusicIcon name="prev" size={13} /></button>
          <button className="p-btn play-btn" type="button" title="播放或暂停" onClick={togglePlayback} disabled={!currentTrack}><MusicIcon name={playing ? 'pause' : 'play'} size={14} /></button>
          <button className="p-btn" type="button" title="下一首" onClick={() => playTrack(nextTrackIndex(currentIndex, tracks.length, mode))} disabled={!tracks.length}><MusicIcon name="next" size={13} /></button>
          <button className="p-btn" type="button" title="添加音乐" onClick={() => inputRef.current?.click()}><MusicIcon name="plus" size={15} /></button>
          <input ref={inputRef} id="musicInput" type="file" accept="audio/*" multiple hidden onChange={addMusicFiles} />
        </div>
        <div className="playlist">
          {tracks.map((track, index) => (
            <div className={`playlist-item${index === currentIndex ? ' active' : ''}`} key={track.url}>
              <button type="button" onClick={() => playTrack(index)}>{track.name}</button>
              <button className="del-track" type="button" onClick={() => removeTrack(index)} aria-label={`移除 ${track.name}`}>✕</button>
            </div>
          ))}
        </div>
      </section>
      <audio ref={audioRef} src={currentTrack?.url} preload="metadata" />
    </>
  )
}
