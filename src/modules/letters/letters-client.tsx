'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

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
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}

function downloadLetters(letters: PublicLetter[]) {
  const blob = new Blob([JSON.stringify(letters, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `continuum-letters-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

function EnvelopeStamp() {
  return (
    <svg className="reference-letter-stamp" viewBox="0 0 60 76" aria-hidden="true">
      <rect x="2" y="2" width="56" height="72" rx="3.5" />
      <rect className="stamp-inner" x="6.5" y="6.5" width="47" height="63" rx="2.5" />
      <g className="stamp-flower" fill="none" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23.6 28.7c-2.5-4.2 2-7.8 3.5-2.1 4.3-2.2 6.2 2.9.1 3.9 1.2 4.7-4.2 5.8-4.1.2-4.1 2.6-6.1-2.4-.2-4.1-1.3-4.9 3.8-5.8 4.2-2.8z" />
        <path d="M37.4 26.4c-3.5-3.7 1.7-6.6.9-.6 5-1.6 5.4 3.2.4 2.8 2.1 4.5-2.6 5.7-3.3.5-3 3.7-5.2-.9-.4-2.7-4.6-.7-3.6-5.5 2.4-3.1z" />
        <path d="M24.8 34.1q1.7 6.9 5.2 11.3M36.4 31.4q-2.8 8.6-6.4 14M29.4 42.4q-2-2.5-5-.9 2 2.6 5 .9z" />
      </g>
      <text x="30" y="13.4" textAnchor="middle">CONTINUUM</text>
      <text className="stamp-bottom" x="30" y="50.6" textAnchor="middle">LETTERS</text>
      <text className="stamp-post" x="30" y="65.2" textAnchor="middle">POST · KC</text>
    </svg>
  )
}

function SealEmblem() {
  return (
    <svg className="reference-seal-emblem" viewBox="0 0 40 40" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 20q4.7-4.9 0-9-4.7 4.1 0 9zM20 20q6.1 3 8.6-2.8-5.4-3.2-8.6 2.8zM20 20q-1 6.7 5.3 7.3Q26.7 21.2 20 20zM20 20q-6.7 1.2-5.3 7.3Q21 26.7 20 20zM20 20q-3.2-6-8.6-2.8Q13.9 23 20 20z" />
        <circle cx="20" cy="20" r="1.7" />
      </g>
    </svg>
  )
}

export function LettersClient({ letters }: { letters: PublicLetter[] }) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [postalCode, setPostalCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredLetters = useMemo(() => {
    const query = search.trim()
    return query ? letters.filter((letter) => letter.postalCode.includes(query)) : letters
  }, [letters, search])

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
    <main className="letters-reference-page">
      <section className="letters-reference-module">
        <div className="reference-module-intro letters-module-intro">
          <div className="reference-module-top"><h1>Letters</h1><span>Asynchronous correspondence</span></div>
          <div className="reference-module-rule" />
          <p>这里是 Continuum 的信箱，用于接收异步时空的信件。<br />公开信会在审核后出现，私人信件只会抵达 Owner 手中。</p>
        </div>

        <div className="letters-reference-toolbar">
          <p>{letters.length} 封信 · {letters.length ? `${(new Blob([JSON.stringify(letters)]).size / 1024).toFixed(1)} KB` : '0.0 KB'}</p>
          <div><label className="letters-postal-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} inputMode="numeric" maxLength={6} placeholder="邮编搜索…" /></label><button type="button" onClick={() => downloadLetters(letters)}>Export Letters</button></div>
        </div>

        <section className="letters-request-card" aria-labelledby="letters-request-title">
          <div className="letters-request-title-row"><div><p className="eyebrow">Write to the space</p><h2 id="letters-request-title">寄一封信</h2></div><span aria-hidden="true">✦</span></div>
          <form onSubmit={(event) => { event.preventDefault(); void submitLetter(event.currentTarget) }}>
            <div className="letters-request-grid">
              <label><span>署名 <small>Signature · optional</small></span><input name="senderName" maxLength={120} placeholder="可以留下名字，也可以保持匿名" /></label>
              <label><span>希望这封信 <small>Visibility</small></span><select name="visibility" defaultValue="private"><option value="private">只寄给 Owner · Private</option><option value="public">审核后公开 · Public wall</option></select></label>
            </div>
            <label><span>信件内容 <small>Letter</small></span><textarea name="content" required maxLength={10_000} rows={6} placeholder="写下你想留在这里的话……" /></label>
            <div className="letters-compose-footer"><p>联系方式与风控信息不会出现在公开信件中。</p><button type="submit" disabled={formState === 'sending'}>{formState === 'sending' ? '寄送中…' : '封存并寄出 →'}</button></div>
            {formState === 'sent' && postalCode && <p className="letters-feedback success">已收到。你的邮编是 <strong>{postalCode}</strong>，请保存它以便以后寻找这封信。</p>}
            {formState === 'error' && <p className="letters-feedback error">{error}</p>}
          </form>
        </section>

        <section className="letters-reference-wall" aria-labelledby="letters-wall-title">
          <div className="letters-reference-wall-heading"><div><p className="eyebrow">Public wall</p><h2 id="letters-wall-title">已抵达的信</h2></div><span>{filteredLetters.length} letters</span></div>
          {filteredLetters.length === 0 ? <p className="letters-empty">{search ? '没有找到这个邮编的信。' : '这里还没有公开信。第一封信可以来自你。'}</p> : <div className="letters-reference-list">{filteredLetters.map((letter) => {
            const isOpen = openId === letter.id
            return <article className={`reference-envelope ${isOpen ? 'is-open' : ''}`} key={letter.id}>
              {!isOpen ? <button type="button" className="reference-envelope-face" onClick={() => setOpenId(letter.id)} aria-label={`拆开 ${letter.postalCode} 的信`}>
                <svg className="reference-envelope-deco" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="5,99 95,99 50,64" /></svg>
                <span className="reference-envelope-postal" aria-label={`邮编 ${letter.postalCode}`}>{letter.postalCode.split('').map((digit, index) => <i key={`${letter.id}-${index}`}>{digit}</i>)}</span>
                <span className="reference-envelope-stamp"><EnvelopeStamp /></span>
                <span className="reference-envelope-address"><strong>To: Keleoz</strong><em>From: {letter.senderName || 'Anonymous'}</em><time>{formatDate(letter.createdAt)}</time></span>
                <span className="reference-envelope-seal"><SealEmblem /></span>
              </button> : <div className="reference-letter-paper"><p className="reference-letter-meta">{letter.postalCode} · {formatDate(letter.createdAt)}</p><p className="reference-letter-content">{letter.content}</p>{letter.ownerReply && <div className="reference-letter-reply"><small>Owner&apos;s reply</small><p>{letter.ownerReply}</p></div>}<button type="button" onClick={() => setOpenId(null)}>收起信件</button></div>}
            </article>
          })}</div>}
        </section>
      </section>
      <Link className="letters-reference-back" href="/">‹ Continuum</Link>
    </main>
  )
}
