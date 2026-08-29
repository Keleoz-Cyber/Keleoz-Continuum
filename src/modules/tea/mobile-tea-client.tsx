'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import {
  TEA_COMBOS,
  TEA_DESSERTS,
  TEA_DRINKS,
  type TeaDessertId,
  type TeaDrinkId,
} from './contracts'
import { saveTeaHistoryRecord } from './local-history-browser'
import {
  appendMobileTeaMessage,
  appendMobileTeaDeparture,
  createMobileTeaState,
  findNearestMobileTeaSelection,
  mobileTeaVisitorRoundLimit,
  projectMobileTeaGatewayMessages,
  selectMobileTeaItem,
  startMobileTeaChat,
  type MobileTeaMessage,
  type MobileTeaState,
} from './mobile-state'

const pendingSessionId = '00000000-0000-4000-8000-000000000000'
const openingInstruction = '茶已经准备好了。请根据氛围自然地开始对话。用一句简短的开场白迎接对方。不要说“你好”这样生硬的话。'
const closingInstruction = '[对方准备结束茶歇了。请温柔地说再见。用1-2句话自然收尾。]'

type SelectionItem = (typeof TEA_DRINKS)[number] | (typeof TEA_DESSERTS)[number]

function assetFor(item: SelectionItem) {
  const prefix = TEA_DRINKS.some((drink) => drink.id === item.id) ? 'tea_icon_' : 'dessert_icon_'
  return `/game/${prefix}${item.id}.png`
}

function slotStyle(item: SelectionItem): React.CSSProperties {
  const scale = Math.max(34 / item.hotspot.width, 34 / item.hotspot.height)
  return {
    backgroundImage: `url(${assetFor(item)})`,
    backgroundPosition: `${Math.round(-item.hotspot.x * scale + (38 - item.hotspot.width * scale) / 2)}px ${Math.round(-item.hotspot.y * scale + (38 - item.hotspot.height * scale) / 2)}px`,
    backgroundSize: `${Math.round(440 * scale)}px ${Math.round(586 * scale)}px`,
  }
}

function sourcePost(state: MobileTeaState, companionName: string) {
  const drink = TEA_DRINKS.find((item) => item.id === state.drink)
  const dessert = TEA_DESSERTS.find((item) => item.id === state.dessert)
  const now = Date.now()
  const content = [
    '【茶歇记录】',
    `搭配：${drink?.cn ?? '?'} × ${dessert?.cn ?? '?'}`,
    `氛围：${state.drink && state.dessert ? TEA_COMBOS[`${state.drink}+${state.dessert}`] : ''}`,
    `轮次：${state.round}`,
    '',
    ...state.messages.map((message) => `${message.role === 'user' ? 'Visitor' : companionName}：${message.content}\n`),
  ].join('\n')
  return {
    id: `tea_${now}`,
    title: `Tea · ${drink?.cn ?? ''} × ${dessert?.cn ?? ''}`,
    subtitle: `${companionName} · ${state.round} rounds`,
    locked: true,
    category: '',
    content,
    created: now,
    updated: now,
  }
}

export function MobileTeaClient({
  companionName,
  maxRequestsPerSession,
}: {
  companionName: string
  maxRequestsPerSession: number
}) {
  const router = useRouter()
  const [state, setState] = useState(() => createMobileTeaState(pendingSessionId))
  const [input, setInput] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedRevision, setSavedRevision] = useState<number | null>(null)
  const [ended, setEnded] = useState(false)
  const requestGenerationRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const sessionRef = useRef(pendingSessionId)
  const visitorRoundLimit = useMemo(
    () => mobileTeaVisitorRoundLimit(maxRequestsPerSession),
    [maxRequestsPerSession],
  )
  const byeHasReservedRequest = maxRequestsPerSession >= 7

  const drink = TEA_DRINKS.find((item) => item.id === state.drink)
  const dessert = TEA_DESSERTS.find((item) => item.id === state.dessert)
  const mood = useMemo(() => {
    if (state.drink && state.dessert) return TEA_COMBOS[`${state.drink}+${state.dessert}`]
    if (drink || dessert) return `${drink?.motto ?? ''}${dessert?.motto ?? ''}再选一个吧。`
    return '选择一杯饮品和一份甜品，不同的搭配将带来不同的对话氛围。'
  }, [dessert, drink, state.dessert, state.drink])

  useEffect(() => () => {
    requestGenerationRef.current += 1
    abortRef.current?.abort()
  }, [])

  function selectDrink(id: TeaDrinkId) {
    setState((current) => selectMobileTeaItem(current, { kind: 'drink', id }))
    setNotice('')
  }

  function selectDessert(id: TeaDessertId) {
    setState((current) => selectMobileTeaItem(current, { kind: 'dessert', id }))
    setNotice('')
  }

  async function requestAssistant(
    baseState: MobileTeaState,
    messages: MobileTeaMessage[],
    options: { endAfterReply?: boolean } = {},
  ) {
    const generation = requestGenerationRef.current + 1
    requestGenerationRef.current = generation
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const isCurrent = () => (
      requestGenerationRef.current === generation
      && sessionRef.current === baseState.sessionId
      && !controller.signal.aborted
    )
    setLoading(true)
    setNotice('')
    try {
      const response = await fetch('/api/ai/tea', {
        method: 'POST',
        credentials: 'same-origin',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: baseState.sessionId,
          drink: baseState.drink,
          dessert: baseState.dessert,
          isNight: false,
          messages: projectMobileTeaGatewayMessages(messages),
        }),
      })
      const body: unknown = await response.json().catch(() => null)
      const result = body && typeof body === 'object' ? body as Record<string, unknown> : {}
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Tea AI 暂时没有回应。')
      if (typeof result.content !== 'string' || !result.content.trim()) throw new Error('Tea AI 返回了无效内容。')
      if (!isCurrent()) return
      const assistantContent = result.content.trim()
      setState((current) => current.sessionId === baseState.sessionId
        ? appendMobileTeaMessage(current, { role: 'assistant', content: assistantContent })
        : current)
      if (options.endAfterReply) setNotice('茶歇结束了。点击 Save 保存对话记录。')
    } catch (error) {
      if (!isCurrent() || (error instanceof DOMException && error.name === 'AbortError')) return
      setNotice(options.endAfterReply
        ? '茶歇结束了。最后的道别未能送达，仍可保存现有记录。'
        : error instanceof Error ? error.message : 'Tea AI 暂时没有回应。')
    } finally {
      if (isCurrent()) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  async function beginChat() {
    const withSession = state.sessionId === pendingSessionId
      ? { ...state, sessionId: crypto.randomUUID() }
      : state
    const started = startMobileTeaChat(withSession)
    if (started.step !== 'chat') {
      setNotice('请先选择一杯饮品和一份甜品。')
      return
    }
    sessionRef.current = started.sessionId
    setEnded(false)
    setState(started)
    await requestAssistant(started, [{ role: 'user', content: openingInstruction }])
  }

  async function send(content = input) {
    const trimmed = content.trim()
    if (!trimmed || loading || ended || state.round >= visitorRoundLimit) return
    const withUser = appendMobileTeaMessage(state, { role: 'user', content: trimmed })
    setState(withUser)
    setInput('')
    await requestAssistant(withUser, withUser.messages)
  }

  async function sayBye() {
    if (loading || ended || state.round < 5 || !byeHasReservedRequest) return
    const departed = appendMobileTeaDeparture(state)
    const closingMessages = departed.messages.map((message, index) => index === departed.messages.length - 1
      ? { ...message, content: `${message.content}\n${closingInstruction}` }
      : message)
    setState(departed)
    setEnded(true)
    await requestAssistant(
      departed,
      closingMessages,
      { endAfterReply: true },
    )
  }

  async function save() {
    if (!state.messages.length || loading || savedRevision === state.transcriptRevision) return
    try {
      await saveTeaHistoryRecord(sourcePost(state, companionName))
      setSavedRevision(state.transcriptRevision)
      setNotice('已保存到当前浏览器。')
    } catch {
      setNotice('保存失败，请稍后再试。')
    }
  }

  function reset() {
    requestGenerationRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    const next = createMobileTeaState(crypto.randomUUID())
    sessionRef.current = next.sessionId
    setState(next)
    setInput('')
    setNotice('')
    setLoading(false)
    setSavedRevision(null)
    setEnded(false)
  }

  function goBack() {
    if (state.step === 'chat') reset()
    else router.back()
  }

  function selectBoardPoint(event: ReactMouseEvent<HTMLDivElement>) {
    if ((event.target as Element).closest('.mobile-tea-hotspot')) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const selection = findNearestMobileTeaSelection(
      ((event.clientX - bounds.left) / bounds.width) * 440,
      ((event.clientY - bounds.top) / bounds.height) * 586,
    )
    if (!selection) return
    if (selection.kind === 'drink') selectDrink(selection.id)
    else selectDessert(selection.id)
  }

  return (
    <main className={`mobile-tea-app mobile-tea-${state.step}`}>
      <i className="mobile-tea-wall" aria-hidden="true" />
      <i className="mobile-tea-scrim" aria-hidden="true" />
      <header className="mobile-tea-head">
        <button type="button" className="mobile-tea-icon-btn" aria-label="返回" onClick={goBack}>
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1><strong>Tea</strong><small>茶歇</small></h1>
        <button type="button" className="mobile-tea-icon-btn" aria-label="重新选择" onClick={reset}>
          <svg viewBox="0 0 24 24"><path d="M5 8a8 8 0 1 1-1 7M5 8V3M5 8h5" /></svg>
        </button>
      </header>

      {state.step === 'select' ? (
        <section className="mobile-tea-select" aria-label="Tea selection">
          <div className="mobile-tea-board" onClick={selectBoardPoint}>
            <Image className="mobile-tea-board-bg" src="/game/tea_select_bg_internal.png" alt="" fill priority unoptimized sizes="(max-width: 440px) 100vw, 440px" />
            <Image className="mobile-tea-board-plate" src="/game/tea_plate.png" alt="" fill unoptimized sizes="(max-width: 440px) 100vw, 440px" />
            {TEA_DRINKS.map((item) => <Image key={`drink-${item.id}`} className={`mobile-tea-art ${state.drink === item.id ? 'selected' : ''}`} src={assetFor(item)} alt="" fill unoptimized sizes="(max-width: 440px) 100vw, 440px" />)}
            {TEA_DESSERTS.map((item) => <Image key={`dessert-${item.id}`} className={`mobile-tea-art ${state.dessert === item.id ? 'selected' : ''}`} src={assetFor(item)} alt="" fill unoptimized sizes="(max-width: 440px) 100vw, 440px" />)}
            {TEA_DRINKS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`mobile-tea-hotspot ${state.drink === item.id ? 'selected' : ''}`}
                aria-label={item.cn}
                title={`${item.cn} · ${item.en}`}
                style={{
                  left: `${(item.hotspot.x / 440) * 100}%`,
                  top: `${(item.hotspot.y / 586) * 100}%`,
                  width: `${(item.hotspot.width / 440) * 100}%`,
                  height: `${(item.hotspot.height / 586) * 100}%`,
                }}
                onClick={() => selectDrink(item.id)}
              />
            ))}
            {TEA_DESSERTS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`mobile-tea-hotspot ${state.dessert === item.id ? 'selected' : ''}`}
                aria-label={item.cn}
                title={`${item.cn} · ${item.en}`}
                style={{
                  left: `${(item.hotspot.x / 440) * 100}%`,
                  top: `${(item.hotspot.y / 586) * 100}%`,
                  width: `${(item.hotspot.width / 440) * 100}%`,
                  height: `${(item.hotspot.height / 586) * 100}%`,
                }}
                onClick={() => selectDessert(item.id)}
              />
            ))}
            <div className="mobile-tea-slot mobile-tea-slot-drink" style={drink ? slotStyle(drink) : undefined} />
            <div className="mobile-tea-slot mobile-tea-slot-dessert" style={dessert ? slotStyle(dessert) : undefined} />
            <p className="mobile-tea-mood">{mood}</p>
          </div>
          {notice ? <p className="mobile-tea-notice" role="status">{notice}</p> : null}
          <button type="button" className="mobile-tea-primary" disabled={!state.drink || !state.dessert || loading} onClick={beginChat}>Start · 入座</button>
        </section>
      ) : (
        <section className="mobile-tea-chat" aria-label="Tea chat">
          <div className="mobile-tea-chat-panel">
            <Image className="mobile-tea-chat-bg" src="/game/tea_chat_bg.png" alt="" fill priority unoptimized sizes="(max-width: 467px) 100vw, 467px" />
            <div className="mobile-tea-chat-title"><strong>{drink?.en}</strong><i>&amp;</i><strong>{dessert?.en}</strong></div>
            <div className="mobile-tea-chat-names">{companionName}<i>&amp;</i>Visitor</div>
            <div className="mobile-tea-messages" aria-live="polite">
              {state.messages.filter((message) => message.visible !== false).map((message, index) => (
                <article key={`${message.role}-${index}`} className={`mobile-tea-message ${message.role}`}>
                  <small>{message.role === 'user' ? 'Visitor' : companionName}</small>
                  <p>{message.content}</p>
                </article>
              ))}
              {loading ? <article className="mobile-tea-message assistant"><small>{companionName}</small><p>……</p></article> : null}
              {notice ? <p className="mobile-tea-chat-notice" role="status">{notice}</p> : null}
            </div>
            <div className="mobile-tea-compose">
              <input
                value={input}
                maxLength={70}
                aria-label="Tea message"
                placeholder="说点什么……"
                disabled={ended || state.round >= visitorRoundLimit}
                onChange={(event) => {
                  setInput(event.target.value)
                  if (notice === '已保存到当前浏览器。') setNotice('')
                }}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void send() } }}
              />
              <button type="button" disabled={!input.trim() || loading || ended || state.round >= visitorRoundLimit} onClick={() => { void send() }}>Send</button>
            </div>
            <div className="mobile-tea-chat-actions">
              <button type="button" disabled={loading || ended || state.round >= visitorRoundLimit} onClick={() => { void send('……') }}>……</button>
              <span>{state.round} / {visitorRoundLimit}</span>
              <button type="button" disabled={state.round < 5 || loading || ended || !byeHasReservedRequest} onClick={() => { void sayBye() }}>{ended ? 'Ended' : 'Bye'}</button>
            </div>
          </div>
          <button
            type="button"
            className="mobile-tea-save"
            disabled={loading || !state.messages.length || savedRevision === state.transcriptRevision}
            onClick={save}
          >
            {savedRevision === state.transcriptRevision ? 'Saved' : 'Save'}
          </button>
        </section>
      )}
    </main>
  )
}
