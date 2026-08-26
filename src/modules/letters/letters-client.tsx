'use client'

import Link from 'next/link'
import { useState } from 'react'

export type PublicLetter = {
  id: string
  postalCode: string
  senderName: string | null
  content: string
  ownerReply: string | null
  createdAt: string
}

type FormState = 'idle' | 'sending' | 'sent' | 'error'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(value),
  )
}

export function LettersClient({ letters }: { letters: PublicLetter[] }) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [postalCode, setPostalCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  async function submitLetter(form: HTMLFormElement) {
    setFormState('sending')
    setError('')
    setPostalCode(null)
    const data = new FormData(form)
    const payload = {
      senderName: String(data.get('senderName') ?? ''),
      content: String(data.get('content') ?? ''),
      visibility: String(data.get('visibility') ?? 'private'),
    }

    try {
      const response = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { postalCode?: string; error?: string }
      if (!response.ok) {
        setFormState('error')
        setError(result.error ?? '信件暂时没有寄出。')
        return
      }
      form.reset()
      setPostalCode(result.postalCode ?? null)
      setFormState('sent')
    } catch {
      setFormState('error')
      setError('网络暂时没有回应，请稍后重试。')
    }
  }

  return (
    <main className="letters-page">
      <header className="letters-page-header">
        <div>
          <p className="eyebrow">Asynchronous correspondence · 异步通信</p>
          <h1>Letters</h1>
          <p>留下匿名或署名的一封信。公开信会在审核后出现在这里，私人信件不会公开。</p>
        </div>
        <Link className="foundation-link" href="/">Continuum</Link>
      </header>

      <section className="letters-compose" aria-labelledby="letter-compose-title">
        <div className="letters-compose-heading">
          <div>
            <p className="eyebrow">Write to the space</p>
            <h2 id="letter-compose-title">寄一封信</h2>
          </div>
          <span aria-hidden="true">✦</span>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void submitLetter(event.currentTarget) }}>
          <label>
            <span>署名 <small>Signature · optional</small></span>
            <input name="senderName" maxLength={120} placeholder="可以留下名字，也可以保持匿名" />
          </label>
          <label>
            <span>信件内容 <small>Letter</small></span>
            <textarea name="content" required maxLength={10_000} rows={8} placeholder="写下你想留在这里的话……" />
          </label>
          <fieldset>
            <legend>希望这封信</legend>
            <label className="letters-radio"><input type="radio" name="visibility" value="private" defaultChecked />只寄给 Owner <small>Private</small></label>
            <label className="letters-radio"><input type="radio" name="visibility" value="public" />审核后公开 <small>Public wall</small></label>
          </fieldset>
          <div className="letters-compose-footer">
            <p>联系方式与风控信息不会出现在公开信件中。</p>
            <button type="submit" disabled={formState === 'sending'}>{formState === 'sending' ? '寄送中…' : '封存并寄出 →'}</button>
          </div>
          {formState === 'sent' && postalCode && <p className="letters-feedback success">已收到。你的邮编是 <strong>{postalCode}</strong>，请保存它以便以后寻找这封信。</p>}
          {formState === 'error' && <p className="letters-feedback error">{error}</p>}
        </form>
      </section>

      <section className="letters-wall" aria-labelledby="letters-wall-title">
        <div className="letters-wall-heading"><div><p className="eyebrow">Public wall</p><h2 id="letters-wall-title">已抵达的信</h2></div><span>{letters.length} letters</span></div>
        {letters.length === 0 ? <p className="letters-empty">这里还没有公开信。第一封信可以来自你。</p> : (
          <div className="letters-list">
            {letters.map((letter) => {
              const isOpen = openId === letter.id
              return (
                <article className={`letter-envelope-card ${isOpen ? 'is-open' : ''}`} key={letter.id}>
                  {!isOpen ? (
                    <button type="button" className="letter-envelope-face" onClick={() => setOpenId(letter.id)} aria-label={`拆开 ${letter.postalCode} 的信`}>
                      <span className="letter-postal" aria-label={`邮编 ${letter.postalCode}`}>{letter.postalCode.split('').map((digit, index) => <i key={`${letter.id}-${index}`}>{digit}</i>)}</span>
                      <span className="letter-stamp">CONTINUUM<br /><b>✦</b></span>
                      <span className="letter-address"><strong>To: Keleoz</strong><small>From: {letter.senderName || 'Anonymous'}</small><time>{formatDate(letter.createdAt)}</time></span>
                      <span className="letter-seal" aria-hidden="true">K</span>
                    </button>
                  ) : (
                    <div className="letter-opened-paper">
                      <p className="letter-opened-meta">{letter.postalCode} · {formatDate(letter.createdAt)}</p>
                      <p className="letter-opened-content">{letter.content}</p>
                      {letter.ownerReply && <div className="letter-owner-reply"><small>Owner&apos;s reply</small><p>{letter.ownerReply}</p></div>}
                      <button type="button" onClick={() => setOpenId(null)}>收起信件</button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
