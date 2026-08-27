import Link from 'next/link'

export function SourcePublicNav({ current }: { current?: 'blog' | 'letters' | 'music' }) {
  return (
    <nav className="source-public-nav" aria-label="主导航">
      <Link className="source-public-brand" href="/">◇ KC</Link>
      <div className="source-public-links">
        <Link className={current === 'blog' ? 'active' : ''} href="/blog">Blog</Link>
        <Link className={current === 'letters' ? 'active' : ''} href="/letters">Letters</Link>
        <Link className={current === 'music' ? 'active' : ''} href="/music">Music</Link>
      </div>
      <Link className="source-public-owner" href="/studio">Studio</Link>
    </nav>
  )
}
