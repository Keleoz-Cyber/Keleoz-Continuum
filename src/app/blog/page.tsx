import Link from 'next/link'

export const metadata = {
  title: 'Blog',
  description: 'Writing from Keleoz Continuum.',
}

export default function BlogFoundationPage() {
  return (
    <main className="foundation-section">
      <header className="foundation-section-header">
        <p className="eyebrow">Writing · 书写</p>
        <h1>Blog</h1>
      </header>
      <div className="foundation-empty">
        <p>尚未发布内容。</p>
        <p className="foundation-empty-note">Published writing will appear here.</p>
      </div>
      <Link className="foundation-link" href="/">
        Return to Continuum
      </Link>
    </main>
  )
}
