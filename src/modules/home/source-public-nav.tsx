import Link from 'next/link'

function PublicMark() {
  return <svg className="source-public-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.55 10.9C10.4 8.1 8.2 5.4 5.6 4.35 3.35 3.45 1.7 4.5 1.95 6.55c.25 2.15 2.35 4.05 4.95 4.9 1.8.58 3.55.45 4.65-.1Z" /><path d="M12.45 10.9c1.1-2.8 3.3-5.5 5.9-6.55 2.25-.9 3.9.15 3.65 2.2-.25 2.15-2.35 4.05-4.95 4.9-1.8.58-3.55.45-4.6-.1Z" /><path d="M11.6 12.55c-1.5-.1-4 .3-5.55 1.8-1.55 1.5-1.3 3.7.4 4.4 1.75.7 3.9-.45 4.9-2.4.6-1.2.7-2.75.25-3.8ZM12.4 12.55c1.5-.1 4 .3 5.55 1.8 1.55 1.5 1.3 3.7-.4 4.4-1.75.7-3.9-.45-4.9-2.4-.6-1.2-.7-2.75-.25-3.8Z" /></svg>
}

export function SourcePublicNav({ current }: { current?: 'blog' | 'letters' | 'room' }) {
  return (
    <nav className="source-public-nav" aria-label="主导航">
      <Link className="source-public-brand" href="/"><PublicMark /> KC</Link>
      <div className="source-public-links">
        <Link className={current === 'blog' ? 'active' : ''} href="/blog">Blog</Link>
        <Link className={current === 'room' ? 'active' : ''} href="/room">Room</Link>
        <Link className={current === 'letters' ? 'active' : ''} href="/letters">Letters</Link>
      </div>
    </nav>
  )
}
