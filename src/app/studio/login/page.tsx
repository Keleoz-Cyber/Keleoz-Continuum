import type { Metadata } from 'next'
import Link from 'next/link'

import { LoginForm } from '@/app/studio/login/login-form'

export const metadata: Metadata = {
  title: 'Owner Studio',
  robots: { index: false, follow: false },
}

export default function StudioLoginPage() {
  return (
    <main className="studio-login-page">
      <section className="studio-login-panel" aria-labelledby="studio-login-title">
        <p className="eyebrow">Private Workspace</p>
        <h1 id="studio-login-title">Owner Studio</h1>
        <p className="studio-login-note">Keleoz Continuum 的创作与发布入口。</p>
        <LoginForm />
        <Link className="foundation-link" href="/">
          Return to Continuum
        </Link>
      </section>
    </main>
  )
}
