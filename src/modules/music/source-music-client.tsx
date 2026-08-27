'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cleanTrackName, nextTrackIndex, parseLrc, type PlaybackMode } from '@/modules/music/contracts'
import { MusicIcon } from '@/modules/music/music-icons'

type LyricSegment = { start: number; text: string }
type Track = { id: string; name: string; url: string; lyrics: LyricSegment[] }

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '--:--'
  const seconds = Math.floor(value)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function lyricIndexAt(segments: LyricSegment[], time: number) {
  let active = -1
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index]!.start <= time) active = index
    else break
  }
  return active
}

export function SourceMusicClient() {
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
  const indexRef = useRef(-1)
  const modeRef = useRef<PlaybackMode>('list')
  const playWhenReadyRef = useRef(false)
  const current = currentIndex >= 0 ? tracks[currentIndex] : undefined
  const lyricIndex = current ? lyricIndexAt(current.lyrics, time) : -1
  const visibleLyrics = useMemo(() => current?.lyrics.slice(Math.max(0, lyricIndex - 4), lyricIndex + 6) ?? [], [current, lyricIndex])
  const progress = duration > 0 ? Math.min(100, Math.max(0, time / duration * 100)) : 0

  useEffect(() => { tracksRef.current = tracks }, [tracks])
  useEffect(() => { indexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => () => tracksRef.current.forEach((track) => URL.revokeObjectURL(track.url)), [])

  const playTrack = useCallback((index: number) => {
    if (index < 0 || index >= tracksRef.current.length) return
    playWhenReadyRef.current = true
    if (index === indexRef.current) {
      const audio = audioRef.current
      if (audio) { audio.currentTime = 0; void audio.play() }
      return
    }
    setCurrentIndex(index)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    setTime(0)
    setDuration(0)
    if (playWhenReadyRef.current && current) {
      playWhenReadyRef.current = false
      void audio.play()
    }
  }, [current])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    function update() { setTime(audio!.currentTime); setDuration(Number.isFinite(audio!.duration) ? audio!.duration : 0) }
    function ended() {
      const next = nextTrackIndex(indexRef.current, tracksRef.current.length, modeRef.current)
      if (next >= 0) playTrack(next)
    }
    const play = () => setPlaying(true)
    const pause = () => setPlaying(false)
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('loadedmetadata', update)
    audio.addEventListener('play', play)
    audio.addEventListener('pause', pause)
    audio.addEventListener('ended', ended)
    return () => {
      audio.removeEventListener('timeupdate', update)
      audio.removeEventListener('loadedmetadata', update)
      audio.removeEventListener('play', play)
      audio.removeEventListener('pause', pause)
      audio.removeEventListener('ended', ended)
    }
  }, [playTrack])

  async function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const lyrics = new Map<string, LyricSegment[]>()
    await Promise.all(files.filter((file) => /\.(lrc|srt|vtt)$/i.test(file.name)).map(async (file) => {
      lyrics.set(cleanTrackName(file.name).toLowerCase(), parseLrc(await file.text()))
    }))
    const additions = files.filter((file) => file.type.startsWith('audio/') || /\.(mp3|m4a|wav|flac|ogg|opus|aac|webm)$/i.test(file.name)).map((file) => ({
      id: crypto.randomUUID(),
      name: cleanTrackName(file.name),
      url: URL.createObjectURL(file),
      lyrics: lyrics.get(cleanTrackName(file.name).toLowerCase()) ?? [],
    }))
    if (additions.length) {
      const start = tracksRef.current.length
      const next = [...tracksRef.current, ...additions]
      tracksRef.current = next
      setTracks(next)
      if (indexRef.current < 0) playTrack(start)
    }
    event.target.value = ''
  }

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio || !current) return
    if (audio.paused) void audio.play()
    else audio.pause()
  }

  function seek(event: React.PointerEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio?.duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audio.duration
  }

  function remove(index: number) {
    const removed = tracksRef.current[index]
    if (!removed) return
    URL.revokeObjectURL(removed.url)
    const next = tracksRef.current.filter((_, itemIndex) => itemIndex !== index)
    tracksRef.current = next
    setTracks(next)
    if (!next.length) setCurrentIndex(-1)
    else if (index === indexRef.current) setCurrentIndex(Math.min(index, next.length - 1))
    else if (index < indexRef.current) setCurrentIndex((value) => value - 1)
  }

  return (
    <main id="music-app" className={`open source-music-app${playing ? ' playing' : ''}`} aria-label="听歌界面">
      <i className="ma-wall" aria-hidden="true" /><i className="ma-cvbg" aria-hidden="true" /><i className="ma-scrim" aria-hidden="true" />
      <div className="ma-head">
        <Link className="icon-btn" href="/" title="返回" aria-label="返回 Continuum"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></Link>
        <div className="ma-title">Music<span className="cn">音乐</span></div>
        <button className="icon-btn" type="button" title="添加音乐或歌词" onClick={() => inputRef.current?.click()}><svg viewBox="0 0 24 24"><path d="M12 5.5v13M5.5 12h13" /></svg></button>
      </div>
      <div className="ma-body">
        <div className="ma-art"><i className="ma-arm" aria-hidden="true"><i /></i><i className="ma-vinyl" aria-hidden="true"><i className="ma-vlabel"><svg viewBox="0 0 24 24"><circle cx="8" cy="17" r="2.4" /><circle cx="17.5" cy="15" r="2.4" /><path d="M10.4 17V7l9-2.1V15" /></svg></i></i></div>
        <div className="ma-inforow"><div className="ma-info"><div className="ma-t">{current?.name ?? 'Music'}</div><div className="ma-s">{current ? 'Local listening · 本地播放' : '尚未添加音乐'}</div></div></div>
        <div className="ma-lyr" aria-live="polite">
          {current?.lyrics.length ? visibleLyrics.map((line) => <button className={`ma-ln${current.lyrics.indexOf(line) === lyricIndex ? ' on' : ''}`} type="button" key={`${line.start}-${line.text}`} onClick={() => { if (audioRef.current) audioRef.current.currentTime = line.start }}>{line.text}</button>) : <div className="ma-lyr-empty">歌词会在同时选择同名 .lrc / .srt / .vtt 后显示。<br />音乐与歌词只留在当前浏览器。</div>}
        </div>
      </div>
      <div className="ma-foot">
        <div className="ma-barrow"><span className="ma-tm">{formatTime(time)}</span><div className="ma-pb" onPointerDown={seek} role="slider" aria-label="播放进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} tabIndex={0}><i style={{ width: `${progress}%` }} /></div><span className="ma-tm">{formatTime(duration)}</span></div>
        <div className="ma-ctl">
          <button className="ma-btn" type="button" title="播放模式" onClick={() => setMode((value) => value === 'list' ? 'single' : value === 'single' ? 'random' : 'list')}><MusicIcon name={mode === 'list' ? 'mode' : mode === 'single' ? 'mode-single' : 'mode-random'} size={22} /></button>
          <button className="ma-btn" type="button" title="上一首" onClick={() => playTrack(currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1)} disabled={!tracks.length}><MusicIcon name="prev" size={22} /></button>
          <button className="ma-btn ma-big" type="button" title="播放或暂停" onClick={togglePlayback} disabled={!current}><MusicIcon name={playing ? 'pause' : 'play'} size={32} /></button>
          <button className="ma-btn" type="button" title="下一首" onClick={() => playTrack(tracks.length ? (currentIndex + 1) % tracks.length : -1)} disabled={!tracks.length}><MusicIcon name="next" size={22} /></button>
          <button className="ma-btn" type="button" title="播放队列" onClick={() => setQueueOpen(true)}><MusicIcon name="queue" size={22} /></button>
        </div>
      </div>
      {queueOpen ? <aside className="source-music-queue" aria-label="播放队列"><header><span>Queue · 播放队列</span><button type="button" onClick={() => setQueueOpen(false)}>×</button></header>{tracks.length ? <ol>{tracks.map((track, index) => <li className={index === currentIndex ? 'on' : ''} key={track.id}><button type="button" onClick={() => playTrack(index)}><span>{track.name}</span><small>{track.lyrics.length ? 'Lyrics' : 'Audio'}</small></button><button type="button" onClick={() => remove(index)} aria-label={`移除 ${track.name}`}>×</button></li>)}</ol> : <p>还没有加入音乐。</p>}</aside> : null}
      <input ref={inputRef} type="file" accept="audio/*,.lrc,.srt,.vtt" multiple hidden onChange={(event) => void addFiles(event)} />
      <audio ref={audioRef} src={current?.url} preload="metadata" />
    </main>
  )
}
