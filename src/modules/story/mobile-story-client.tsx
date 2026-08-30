'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { saveStoryHistoryRecord } from './local-history-browser'
import {
  applyMobileStoryReply,
  chooseMobileStoryOption,
  createMobileStoryState,
  mobileStoryRoundLimit,
  parseSourceStoryReply,
  startMobileStory,
  type MobileStoryState,
  type StoryMood,
} from './mobile-state'
import type { StoryGenre, StoryHorrorLevel } from './contracts'

const pendingSessionId = '00000000-0000-4000-8000-000000000000'
const moodColumn: Record<StoryMood, number> = { calm: 2, joy: 0, tense: 1, sad: 3, shock: 4 }
const genreLabels: Array<{ value: StoryGenre; label: string }> = [
  { value: 'fantasy', label: 'Fantasy · 奇幻' },
  { value: 'mystery', label: 'Mystic · 神秘学' },
  { value: 'detective', label: 'Detective · 推理悬疑' },
  { value: 'romance', label: 'Romance · 恋爱' },
  { value: 'scifi', label: 'Sci-Fi · 科幻' },
]
const horrorLabels: Array<{ value: StoryHorrorLevel; label: string }> = [
  { value: 'no', label: 'No · 无' },
  { value: 'low', label: 'Low · 轻微' },
  { value: 'mid', label: 'Medium · 中等' },
  { value: 'high', label: 'High · 强烈' },
]

function readableHistory(state: MobileStoryState) {
  return state.messages.map((message) => {
    if (message.role === 'user') return `▸ ${message.content}`
    const turn = parseSourceStoryReply(message.content)
    return `${turn.story}\n\n${turn.choices.length ? `选项: ${turn.choices.join(' / ')}` : ''}`.trim()
  }).join('\n\n')
}

function sourcePost(input: {
  id: string
  title: string
  subtitle: string
  content: string
  created: number
}) {
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle,
    locked: true as const,
    category: '',
    content: input.content,
    created: input.created,
    updated: Date.now(),
  }
}

function StoryStage({ mood, loading, saveState }: {
  mood: StoryMood
  loading: boolean
  saveState: 'idle' | 'saving' | 'ok' | 'fail'
}) {
  return (
    <div className="mobile-story-stage">
      <Image src="/game/story_win_day.png" alt="" fill priority unoptimized sizes="(max-width: 608px) 100vw, 608px" />
      <div className={`mobile-story-sprite mood-${mood}`} data-mood={mood}>
        <i style={{ backgroundPositionX: `${moodColumn[mood] * 25}%` }} />
      </div>
      {mood !== 'calm' ? <div className={`mobile-story-emote emote-${mood}`} aria-hidden="true"><span>{mood === 'joy' ? '♪' : mood === 'shock' ? '✦' : mood === 'sad' ? '|||': '!'}</span></div> : null}
      {loading ? <div className="mobile-story-thinking" aria-label="Story thinking">......</div> : null}
      {saveState !== 'idle' ? <div className={`mobile-story-save-state ${saveState}`}>{saveState === 'saving' ? 'SAVING…' : saveState === 'ok' ? 'SAVE OK!' : 'SAVE FAIL'}</div> : null}
    </div>
  )
}

export function MobileStoryClient({
  companionName,
  maxRequestsPerSession,
}: {
  companionName: string
  maxRequestsPerSession: number
}) {
  const router = useRouter()
  const [state, setState] = useState(() => createMobileStoryState(pendingSessionId))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [savedRevision, setSavedRevision] = useState<number | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [stageSaveState, setStageSaveState] = useState<'idle' | 'saving' | 'ok' | 'fail'>('idle')
  const requestGenerationRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const sessionRef = useRef(pendingSessionId)
  const roundLimit = useMemo(() => mobileStoryRoundLimit(maxRequestsPerSession), [maxRequestsPerSession])
  const mood = state.current?.mood ?? 'calm'

  useEffect(() => () => {
    requestGenerationRef.current += 1
    abortRef.current?.abort()
  }, [])

  function cancelRequest() {
    requestGenerationRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
  }

  async function requestTurn(baseState: MobileStoryState) {
    const generation = requestGenerationRef.current + 1
    requestGenerationRef.current = generation
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const isCurrent = () => requestGenerationRef.current === generation
      && sessionRef.current === baseState.sessionId
      && !controller.signal.aborted
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/ai/story', {
        method: 'POST', credentials: 'same-origin', signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'turn', sessionId: baseState.sessionId,
          genre: baseState.genre, horror: baseState.horror, customScript: null,
          messages: baseState.messages,
        }),
      })
      const body: unknown = await response.json().catch(() => null)
      const result = body && typeof body === 'object' ? body as Record<string, unknown> : {}
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Story AI 暂时没有回应。')
      if (typeof result.content !== 'string' || !result.content.trim()) throw new Error('Story AI 返回了无效内容。')
      if (!isCurrent()) return
      setState((current) => current.sessionId === baseState.sessionId
        ? applyMobileStoryReply(current, result.content as string, typeof result.documentGrant === 'string' ? result.documentGrant : null)
        : current)
    } catch (reason) {
      if (!isCurrent() || (reason instanceof DOMException && reason.name === 'AbortError')) return
      setError(reason instanceof Error ? reason.message : 'Story AI 暂时没有回应。')
    } finally {
      if (isCurrent()) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  async function beginStory() {
    if (roundLimit < 1 || loading) return
    const next = startMobileStory(createMobileStoryState(crypto.randomUUID(), state.genre, state.horror))
    sessionRef.current = next.sessionId
    setState(next)
    setSavedRevision(null)
    setError('')
    setNotice('')
    await requestTurn(next)
  }

  async function choose(choice: string) {
    if (loading) return
    const next = chooseMobileStoryOption(state, choice, roundLimit)
    if (next === state) return
    setState(next)
    await requestTurn(next)
  }

  async function saveProgress(targetState = state) {
    if (!targetState.messages.length || saving) return false
    setSaving(true)
    setStageSaveState('saving')
    const now = Date.now()
    try {
      await saveStoryHistoryRecord(sourcePost({
        id: `post_${now}`,
        title: `📖 Story 进度 — ${companionName}`,
        subtitle: `第${targetState.round}轮 · 进行中`,
        content: `【互动故事 · 进度存档】（第${targetState.round}轮，故事进行中）\n\n${readableHistory(targetState)}`,
        created: now,
      }))
      setSavedRevision(targetState.transcriptRevision)
      setNotice(`已存档当前进度（第${targetState.round}轮）。`)
      setStageSaveState('ok')
      return true
    } catch {
      setNotice('进度存档失败。')
      setStageSaveState('fail')
      return false
    } finally {
      setSaving(false)
      window.setTimeout(() => setStageSaveState('idle'), 1_700)
    }
  }

  async function saveEnding() {
    if (saving || state.step !== 'ending') return
    const snapshot = state
    const created = Date.now()
    const id = `post_${created}`
    const raw = readableHistory(snapshot)
    setSaving(true)
    setStageSaveState('saving')
    try {
      if (!snapshot.documentGrant) throw new Error('No document grant')
      await saveStoryHistoryRecord(sourcePost({
        id, title: `📜 Story Design — ${companionName}`,
        subtitle: `设定文档生成中… · ${snapshot.round} Rounds`,
        content: `（AI正在为你生成完整设定文档，完成后本文档会被自动替换。以下是原始记录。）\n\n${raw}`,
        created,
      }))

      let documentSoFar = ''
      let documentGrant = snapshot.documentGrant
      for (let segment = 0; segment < 4; segment += 1) {
        const response = await fetch('/api/ai/story', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'document', sessionId: snapshot.sessionId,
            genre: snapshot.genre, horror: snapshot.horror, customScript: null,
            messages: snapshot.messages, documentSoFar, documentSegment: segment,
            documentGrant,
          }),
        })
        const body: unknown = await response.json().catch(() => null)
        const result = body && typeof body === 'object' ? body as Record<string, unknown> : {}
        if (!response.ok) throw new Error('Document request failed')
        if (typeof result.content !== 'string' || !result.content.trim()) throw new Error('Empty document')
        documentSoFar += result.content
        if (result.truncated !== true) break
        if (segment === 3) {
          documentSoFar += '\n\n（注：文本内容过长，连续4段输出后依然超过上限字符数，已在此截断。）'
          break
        }
        if (typeof result.documentGrant !== 'string') throw new Error('Document continuation failed')
        documentGrant = result.documentGrant
      }
      await saveStoryHistoryRecord(sourcePost({
        id, title: `📜 Story Design — ${companionName}`,
        subtitle: `Full Game Design Document · ${snapshot.round} Rounds`,
        content: documentSoFar,
        created,
      }))
      setNotice('完整设定文档已保存到当前浏览器。')
      setStageSaveState('ok')
    } catch {
      await saveStoryHistoryRecord(sourcePost({
        id, title: `Interactive Story - ${companionName}`,
        subtitle: `Round ${snapshot.round}`,
        content: `【互动故事记录】\n\n${raw}`,
        created,
      })).catch(() => undefined)
      setNotice('完整设定生成失败，已保存原始故事记录。')
      setStageSaveState('fail')
    } finally {
      setSaving(false)
      window.setTimeout(() => setStageSaveState('idle'), 2_000)
    }
  }

  function resetToSetup() {
    if (saving) return
    cancelRequest()
    const next = createMobileStoryState(crypto.randomUUID(), state.genre, state.horror)
    sessionRef.current = next.sessionId
    setState(next)
    setError('')
    setNotice('')
    setSavedRevision(null)
    setConfirmExit(false)
  }

  async function replay() {
    if (saving) return
    resetToSetup()
    const next = startMobileStory(createMobileStoryState(crypto.randomUUID(), state.genre, state.horror))
    sessionRef.current = next.sessionId
    setState(next)
    await requestTurn(next)
  }

  function back() {
    if (state.step === 'setup') router.back()
    else setConfirmExit(true)
  }

  return (
    <main className={`mobile-story-app step-${state.step}`}>
      <i className="mobile-story-wall" aria-hidden="true" />
      <header className="mobile-story-head">
        <button type="button" className="mobile-story-icon" aria-label="返回" disabled={saving} onClick={back}><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></button>
        <h1><strong>Story</strong><small>故事</small></h1>
        <button type="button" className="mobile-story-icon" aria-label="重新选择" disabled={saving} onClick={() => state.step === 'setup' ? undefined : setConfirmExit(true)}><svg viewBox="0 0 24 24"><path d="M5 8a8 8 0 1 1-1 7M5 8V3M5 8h5" /></svg></button>
      </header>

      {state.step === 'setup' ? (
        <section className="mobile-story-setup" aria-label="Story setup">
          <StoryStage mood="calm" loading={false} saveState="idle" />
          <div className="mobile-story-setup-card">
            <p>Interactive Story</p>
            <label>Genre<select value={state.genre} onChange={(event) => setState({ ...state, genre: event.target.value as StoryGenre })}>{genreLabels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>Horror Elements<select value={state.horror} onChange={(event) => setState({ ...state, horror: event.target.value as StoryHorrorLevel })}>{horrorLabels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <button type="button" className="mobile-story-primary" disabled={roundLimit < 1} onClick={() => { void beginStory() }}>Start · 开始</button>
          </div>
        </section>
      ) : (
        <section className="mobile-story-game" aria-label="Story game">
          <StoryStage mood={mood} loading={loading} saveState={stageSaveState} />
          <div className="mobile-story-dialogue">
            <div className="mobile-story-speaker">{state.current ? companionName : 'Keleoz'}</div>
            <div className="mobile-story-text" aria-live="polite">
              {loading ? '……' : error ? `连接遇到了问题：${error}` : state.current?.story ?? '故事正在展开。'}
            </div>
            {!loading && !error && state.step === 'playing' && state.current ? (
              <div className="mobile-story-choices">
                {state.current.choices.map((choice) => <button type="button" key={choice} disabled={state.round >= roundLimit} onClick={() => { void choose(choice) }}>{choice}</button>)}
                {state.round >= roundLimit ? <p>已到本次故事的回合上限，请保存进度或退出。</p> : null}
              </div>
            ) : null}
            {error ? (
              <div className="mobile-story-actions">
                <button type="button" onClick={() => { void requestTurn(state) }}>重试</button>
                <button type="button" onClick={() => { void saveProgress().then(resetToSetup) }}>存档并退出</button>
                <button type="button" onClick={resetToSetup}>退出</button>
              </div>
            ) : null}
            {state.step === 'ending' && !error ? (
              <div className="mobile-story-actions ending">
                <button type="button" disabled={saving} onClick={() => { void saveEnding() }}>Save</button>
                <button type="button" disabled={saving} onClick={() => { void replay() }}>Replay</button>
                <button type="button" disabled={saving} onClick={resetToSetup}>Exit</button>
              </div>
            ) : null}
            {state.step === 'playing' && !error ? (
              <div className="mobile-story-foot">
                <button type="button" disabled={loading || saving || savedRevision === state.transcriptRevision} onClick={() => { void saveProgress() }}>{savedRevision === state.transcriptRevision ? 'Saved' : '✦ Save'}</button>
                <span>{state.round} / {roundLimit}</span>
              </div>
            ) : null}
          </div>
          {notice ? <p className="mobile-story-notice" role="status">{notice}</p> : null}
        </section>
      )}

      {confirmExit ? <div className="mobile-story-confirm" role="dialog" aria-label="退出 Story"><div><p>游戏还在进行中，确定退出吗？</p><button type="button" onClick={() => setConfirmExit(false)}>继续游戏</button><button type="button" onClick={resetToSetup}>退出故事</button></div></div> : null}
    </main>
  )
}
