'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  autoMemoryEvents: Array<{ ok: boolean; label: string; detail: string }>
}

export function OwnerChatClient(props: {
  thread: { id: string; archived: boolean; companionName: string; messages: Message[] } | null
  aiEnabled: boolean
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(props.thread?.messages ?? [])
  const [content, setContent] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  if (!props.thread) return <div className="owner-chat-empty">选择同行者并创建一段对话。</div>

  async function send() {
    const value = content.trim()
    if (!value || pending || !props.thread) return
    setPending(true)
    setError('')
    setContent('')
    const optimistic: Message = { id: `pending-${Date.now()}`, role: 'user', content: value, createdAt: new Date(), autoMemoryEvents: [] }
    setMessages((current) => [...current, optimistic])
    try {
      const response = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ threadId: props.thread.id, content: value }),
      })
      const body = await response.json() as { content?: string; autoMemoryEvents?: Message['autoMemoryEvents']; code?: string }
      if (!response.ok || !body.content) throw new Error(body.code || 'chat_failed')
      setMessages((current) => [...current, {
        id: `reply-${Date.now()}`, role: 'assistant', content: body.content!, createdAt: new Date(), autoMemoryEvents: body.autoMemoryEvents ?? [],
      }])
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error && caught.message === 'disabled'
        ? 'AI 网关尚未配置。对话和记忆界面仍可管理。'
        : '消息没有得到回复，请检查 AI 设置后重试。')
    } finally {
      setPending(false)
    }
  }

  return <section className="owner-chat-main" aria-label={`Chat with ${props.thread.companionName}`}>
    <div className="owner-chat-messages">
      {messages.length ? messages.map((message) => <article className={`owner-chat-message ${message.role}`} key={message.id}>
        <small>{message.role === 'user' ? 'Owner' : props.thread!.companionName}</small>
        <p>{message.content}</p>
        {message.autoMemoryEvents.map((event, index) => <div className={`owner-memory-event ${event.ok ? 'ok' : 'failed'}`} key={`${message.id}-${index}`}><strong>{event.label}</strong><span>{event.detail}</span></div>)}
      </article>) : <div className="owner-chat-empty">选择一个话题开始对话。</div>}
      {pending ? <div className="owner-chat-typing">{props.thread.companionName} is writing…</div> : null}
    </div>
    <div className="owner-chat-compose">
      <textarea aria-label="Chat message" value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} placeholder={props.aiEnabled ? '输入消息…' : 'AI gateway disabled'} disabled={!props.aiEnabled || props.thread.archived} rows={2} />
      <button type="button" onClick={() => void send()} disabled={!props.aiEnabled || props.thread.archived || pending || !content.trim()} aria-label="Send message">➤</button>
    </div>
    {error ? <p className="owner-chat-error" role="alert">{error}</p> : null}
  </section>
}
