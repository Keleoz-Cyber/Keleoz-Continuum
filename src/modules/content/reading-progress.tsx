'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [fontSize, setFontSize] = useState<'s' | 'm' | 'l'>('m')
  const [query, setQuery] = useState('')
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const maximum = document.documentElement.scrollHeight - window.innerHeight
      setProgress(maximum > 0 ? Math.min(100, Math.max(0, (window.scrollY / maximum) * 100)) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const article = document.getElementById('continuum-article')
    if (article) article.dataset.fontSize = fontSize
  }, [fontSize])

  function updateSearch(value: string) {
    setQuery(value)
    const text = document.getElementById('continuum-article')?.textContent?.toLocaleLowerCase() ?? ''
    const needle = value.trim().toLocaleLowerCase()
    if (!needle) {
      setMatchCount(0)
      return
    }
    let index = 0
    let count = 0
    while ((index = text.indexOf(needle, index)) >= 0) {
      count += 1
      index += needle.length
    }
    setMatchCount(count)
  }

  function stepSearch(direction: number) {
    if (!query.trim()) return
    const article = document.getElementById('continuum-article')
    if (!article) return
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
    const needle = query.trim().toLocaleLowerCase()
    const nodes: Text[] = []
    let node: Node | null = walker.nextNode()
    while (node) {
      if (node.textContent?.toLocaleLowerCase().includes(needle)) nodes.push(node as Text)
      node = walker.nextNode()
    }
    const target = nodes[direction > 0 ? 0 : nodes.length - 1]
    target?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="reading-tools" aria-label="Reading controls">
      <div className="reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <div className="reference-reader-toolbar">
        <Link href="/blog" className="reference-reader-back">← Back</Link>
        <div className="reference-reader-search"><span>⌕</span><input value={query} onChange={(event) => updateSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') stepSearch(event.shiftKey ? -1 : 1) }} placeholder="搜索本文…" aria-label="搜索本文" />{matchCount > 0 && <small>{matchCount}</small>}<button type="button" onClick={() => stepSearch(-1)} aria-label="上一处">↑</button><button type="button" onClick={() => stepSearch(1)} aria-label="下一处">↓</button></div>
        <div className="reading-fonts" aria-label="Text size">{(['s', 'm', 'l'] as const).map((size) => <button aria-pressed={fontSize === size} key={size} onClick={() => setFontSize(size)} type="button">A</button>)}</div>
      </div>
    </div>
  )
}
