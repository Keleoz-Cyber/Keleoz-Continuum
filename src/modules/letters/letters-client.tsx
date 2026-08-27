'use client'

import { useId, useMemo, useState } from 'react'

import { SourcePublicNav } from '@/modules/home/source-public-nav'

export type PublicLetter = {
  id: string
  postalCode: string
  senderName: string | null
  content: string
  ownerReply: string | null
  createdAt: string
}

type FormState = 'idle' | 'sending' | 'sent' | 'error'

const DEMO_LETTER: PublicLetter = {
  id: '__continuum_demo__',
  postalCode: '260323',
  senderName: 'Keleoz',
  content: '这是 Keleoz Continuum 的展示信封。\n真实公开信会在 Owner 审核后出现在这里。',
  ownerReply: null,
  createdAt: '2026-08-26T00:00:00.000Z',
}

function formatDate(value: string) {
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

function LetterStamp() {
  const maskId = useId().replaceAll(':', '')
  return (
    <svg className="stamp-svg" viewBox="0 0 60 76" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs><mask id={maskId}><rect x="2" y="2" width="56" height="72" rx="3.5" fill="#fff" />{Array.from({ length: 10 }, (_, index) => <circle key={`l-${index}`} cx="2" cy={2 + index * 8} r="2.4" />)}{Array.from({ length: 10 }, (_, index) => <circle key={`r-${index}`} cx="58" cy={2 + index * 8} r="2.4" />)}{Array.from({ length: 6 }, (_, index) => <circle key={`t-${index}`} cx={10 + index * 8} cy="2" r="2.4" />)}{Array.from({ length: 6 }, (_, index) => <circle key={`b-${index}`} cx={10 + index * 8} cy="74" r="2.4" />)}</mask></defs>
      <rect className="stamp-paper" x="2" y="2" width="56" height="72" rx="3.5" mask={`url(#${maskId})`} />
      <rect className="stamp-frame" x="6.5" y="6.5" width="47" height="63" rx="2.5" fill="none" />
      <g className="stamp-flower" fill="none" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"><path d="M23.6 28.7c-2.5-4.2 2-7.8 3.5-2.1 4.3-2.2 6.2 2.9.1 3.9 1.2 4.7-4.2 5.8-4.1.2-4.1 2.6-6.1-2.4-.2-4.1-1.3-4.9 3.8-5.8 4.2-2.8z" /><path d="M37.4 26.4c-3.5-3.7 1.7-6.6.9-.6 5-1.6 5.4 3.2.4 2.8 2.1 4.5-2.6 5.7-3.3.5-3 3.7-5.2-.9-.4-2.7-4.6-.7-3.6-5.5 2.4-3.1z" /><path d="M24.8 34.1q1.7 6.9 5.2 11.3M36.4 31.4q-2.8 8.6-6.4 14M29.4 42.4q-2-2.5-5-.9 2 2.6 5 .9z" /></g>
      <text className="stamp-txt-top" x="30" y="13.4" textAnchor="middle">KELEOZ</text><text className="stamp-txt-bot" x="30" y="50.6" textAnchor="middle">CONTINUUM</text><text className="stamp-txt-post" x="30" y="65.2" textAnchor="middle">POST · KC</text>
    </svg>
  )
}

function SealEmblem() {
  return <svg className="seal-emblem-svg" viewBox="0 0 40 40" aria-hidden="true"><g className="seal-emblem" fill="none" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20Q24.7 15.14 20 11Q15.3 15.14 20 20Z" /><path d="M20 20Q26.07 22.97 28.56 17.22Q23.17 14.03 20 20Z" /><path d="M20 20Q19.05 26.69 25.29 27.28Q26.66 21.17 20 20Z" /><path d="M20 20Q13.34 21.17 14.71 27.28Q20.95 26.69 20 20Z" /><path d="M20 20Q16.83 14.03 11.44 17.22Q13.93 22.97 20 20Z" /><circle cx="20" cy="20" r="1.7" /></g></svg>
}

export function LettersClient({ letters }: { letters: PublicLetter[] }) {
  const [composeOpen, setComposeOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>('idle')
  const [postalCode, setPostalCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredLetters = useMemo(() => {
    const query = search.trim()
    return query ? letters.filter((letter) => letter.postalCode.includes(query)) : letters
  }, [letters, search])
  const totalSize = useMemo(() => new Blob([JSON.stringify(letters)]).size, [letters])
  const displayedLetters = filteredLetters.length ? filteredLetters : search.trim() ? [] : [DEMO_LETTER]

  async function submitLetter(form: HTMLFormElement) {
    setFormState('sending')
    setError('')
    setPostalCode(null)
    const data = new FormData(form)
    try {
      const response = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ senderName: String(data.get('senderName') ?? ''), content: String(data.get('content') ?? ''), visibility: String(data.get('visibility') ?? 'private') }),
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
    <main className="source-public-page source-letters-page">
      <div className="source-public-bg" aria-hidden="true" />
      <SourcePublicNav current="letters" />
      <section className="source-page active" id="page-letters">
        <div className="module-intro">
          <div className="module-intro-top"><h1>Letters</h1><span className="module-intro-sub">Asynchronous correspondence</span></div>
          <div className="module-intro-rule" />
          <div className="module-intro-desc">这里是 Continuum 邮件箱，用于接收异步时空的信件。<br />公开信在 Owner 审核后展示；私人信只抵达 Owner，其他访客不能继续评论。</div>
        </div>
        <div className="blog-header">
          <div className="blog-stats">{letters.length} 封信 · {(totalSize / 1024).toFixed(1)} KB</div>
          <div className="blog-actions"><input className="btn letter-search-input" value={search} onChange={(event) => setSearch(event.target.value)} inputMode="numeric" maxLength={6} placeholder="邮编搜索…" /><button className="btn" type="button" onClick={() => downloadLetters(letters)}>Export Letters</button></div>
        </div>
        <div className="glass-card letter-public-request">
          <div className="letter-request-title">Send a letter to Keleoz</div>
          <div className="letter-request-area"><span className="letter-public-mode">Anonymous or signed · Public or private</span><button className="btn btn-primary" type="button" onClick={() => { setComposeOpen(true); setFormState('idle'); setPostalCode(null) }}>✉ 写一封信</button></div>
          <div className="letter-request-hint">公开信会先进入审核箱；如果你想评论文章，也可以在这里留下匿名或署名来信。</div>
        </div>
        <div id="letters-container">
          {displayedLetters.length ? displayedLetters.map((letter) => {
            const opened = openId === letter.id
            const date = formatDate(letter.createdAt)
            return <div className="letter-item" data-postal={letter.postalCode} key={letter.id}>
              {!opened ? <div className="letter-envelope"><div className="envelope-face">
                <svg className="envelope-deco" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon className="flap-fill" points="5,99 95,99 50,64" vectorEffect="non-scaling-stroke" /></svg>
                <div className="envelope-postal">{letter.postalCode.split('').map((digit, index) => <span className="pc-cell" key={`${letter.id}-${index}`}>{digit}</span>)}</div>
                <div className="envelope-stamp"><LetterStamp /></div>
                <div className="envelope-addr"><div className="envelope-to">To: Keleoz</div><div className="envelope-from">From: {letter.senderName || 'Anonymous'}</div><div className="envelope-date">{date}</div></div>
                <button className="envelope-seal" type="button" onClick={() => setOpenId(letter.id)} title="拆开信件"><SealEmblem /></button>
              </div></div> : <div className="letter-card glass-card letter-expanded">
                <div className="letter-card-content">{letter.content}</div>
                {letter.ownerReply ? <div className="letter-owner-reply"><span>Reply from Keleoz</span><p>{letter.ownerReply}</p></div> : null}
                <div className="letter-card-meta">{date}</div>
                <div className="letter-card-actions"><button className="letter-close-btn" type="button" onClick={() => setOpenId(null)}>收起信件</button></div>
              </div>}
            </div>
          }) : <div className="empty-state"><span>✉</span>{search ? 'No letter with that postal code.' : 'Letters lost...'}</div>}
        </div>
      </section>

      {composeOpen ? <div className="letter-compose-overlay" role="dialog" aria-modal="true" aria-labelledby="compose-title" onPointerDown={(event) => { if (event.target === event.currentTarget) setComposeOpen(false) }}><section className="letter-compose-sheet glass-card">
        <header><div><p>Write to the space</p><h2 id="compose-title">寄一封信</h2></div><button type="button" onClick={() => setComposeOpen(false)} aria-label="关闭写信">×</button></header>
        <form onSubmit={(event) => { event.preventDefault(); void submitLetter(event.currentTarget) }}>
          <div className="letter-compose-grid"><label><span>署名 <small>optional</small></span><input name="senderName" maxLength={120} placeholder="可以匿名" /></label><label><span>可见范围</span><select name="visibility" defaultValue="private"><option value="private">只寄给 Owner</option><option value="public">审核后公开</option></select></label></div>
          <label><span>信件内容</span><textarea name="content" required maxLength={10_000} rows={7} placeholder="写下你想留在这里的话……" /></label>
          <footer><small>联系方式与风控信息不会公开。</small><button className="btn btn-primary" type="submit" disabled={formState === 'sending'}>{formState === 'sending' ? '寄送中…' : '封存并寄出'}</button></footer>
          {formState === 'sent' && postalCode ? <p className="letter-compose-feedback success">已收到。邮编是 <strong>{postalCode}</strong>，请保存以便寻找。</p> : null}
          {formState === 'error' ? <p className="letter-compose-feedback error">{error}</p> : null}
        </form>
      </section></div> : null}
    </main>
  )
}
