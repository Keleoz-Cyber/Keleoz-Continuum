'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [fontSize, setFontSize] = useState<'s' | 'm' | 'l'>('m')

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

  return (
    <div className="reading-tools" aria-label="Reading controls">
      <div className="reading-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="reading-fonts" aria-label="Text size">
        {(['s', 'm', 'l'] as const).map((size) => (
          <button
            aria-pressed={fontSize === size}
            key={size}
            onClick={() => setFontSize(size)}
            type="button"
          >
            A
          </button>
        ))}
      </div>
    </div>
  )
}
