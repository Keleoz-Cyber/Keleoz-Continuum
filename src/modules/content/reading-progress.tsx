'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [fontSize, setFontSize] = useState<'s' | 'm' | 'l'>('m')
  const [query, setQuery] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [matchIndex, setMatchIndex] = useState(-1)
  const matches = useRef<Range[]>([])
  const currentMatch = useRef(-1)

  useEffect(() => {
    const reader = document.getElementById('blog-read-view')
    if (!reader) return
    reader.classList.remove('fontsize-s', 'fontsize-m', 'fontsize-l')
    reader.classList.add(`fontsize-${fontSize}`)
  }, [fontSize])

  useEffect(() => () => { CSS.highlights?.delete('continuum-reader-match') }, [])

  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0)
    }
    function onScroll() { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) window.cancelAnimationFrame(frame) }
  }, [fontSize])

  function showMatch(index: number) {
    currentMatch.current = index
    setMatchIndex(index)
    CSS.highlights?.delete('continuum-reader-match')
    if (!CSS.highlights) window.getSelection()?.removeAllRanges()
    const range = matches.current[index]
    if (!range) return
    if (typeof Highlight !== 'undefined' && CSS.highlights) {
      CSS.highlights.set('continuum-reader-match', new Highlight(range))
    } else {
      const selection = window.getSelection()
      selection?.addRange(range)
    }
    const rect = range.getBoundingClientRect()
    window.scrollBy({ top: rect.top + rect.height / 2 - window.innerHeight / 2, behavior: 'smooth' })
  }

  function updateSearch(value: string) {
    setQuery(value)
    const needle = value.trim()
    const article = document.getElementById('continuum-article')
    matches.current = []
    if (needle && article) {
      // Literal, case-insensitive matches preserve offsets in the original text.
      const pattern = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu')
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node) {
        for (const hit of (node.textContent ?? '').matchAll(pattern)) {
          const range = document.createRange()
          range.setStart(node, hit.index)
          range.setEnd(node, hit.index + hit[0].length)
          matches.current.push(range)
        }
        node = walker.nextNode()
      }
    }
    setMatchCount(matches.current.length)
    showMatch(matches.current.length ? 0 : -1)
  }

  function stepSearch(direction: number) {
    const count = matches.current.length
    if (count) showMatch((currentMatch.current + direction + count) % count)
  }

  return (
    <>
      <div className="brv-top">
        <Link className="btn" href="/blog">← Back</Link>
        <div className="brv-search">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.4" /><path d="m13.6 13.6-3.3-3.3" /></svg>
          <input value={query} onChange={(event) => updateSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') stepSearch(event.shiftKey ? -1 : 1) }} placeholder="搜索本文…" aria-label="搜索本文" />
          <span className="brv-search-count" aria-live="polite">{query.trim() ? `${matchIndex + 1}/${matchCount}` : ''}</span>
          <button className="brv-search-nav" type="button" onClick={() => stepSearch(-1)} title="上一处" aria-label="上一处"><svg viewBox="0 0 16 16"><polyline points="4.5 9.8 8 6.3 11.5 9.8" /></svg></button>
          <button className="brv-search-nav" type="button" onClick={() => stepSearch(1)} title="下一处" aria-label="下一处"><svg viewBox="0 0 16 16"><polyline points="4.5 6.3 8 9.8 11.5 6.3" /></svg></button>
        </div>
        <div className="read-fontsize-wrap" aria-label="字号"><button className={`read-fontsize-btn fs-s${fontSize === 's' ? ' active' : ''}`} type="button" onClick={() => setFontSize('s')} aria-pressed={fontSize === 's'}>A</button><button className={`read-fontsize-btn fs-m${fontSize === 'm' ? ' active' : ''}`} type="button" onClick={() => setFontSize('m')} aria-pressed={fontSize === 'm'}>A</button><button className={`read-fontsize-btn fs-l${fontSize === 'l' ? ' active' : ''}`} type="button" onClick={() => setFontSize('l')} aria-pressed={fontSize === 'l'}>A</button></div>
      </div>
      <div className="brv-progress" aria-hidden="true"><i id="brv-progress-i" style={{ width: `${progress}%` }} /></div>
    </>
  )
}
