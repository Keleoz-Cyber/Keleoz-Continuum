import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="foundation-home">
      <div className="foundation-copy">
        <p className="eyebrow">A Personal Digital Space.</p>
        <h1>Keleoz Continuum</h1>
        <p className="definition">一个持续生长的个人数字空间。</p>
        <Link className="foundation-link" href="/blog">
          Enter the writing
        </Link>
      </div>
    </main>
  )
}
