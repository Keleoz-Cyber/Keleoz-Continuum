import Link from 'next/link'

import { logoutAction } from '@/modules/auth/actions'
import { requireOwner } from '@/modules/auth/dal'

export default async function ProtectedStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const owner = await requireOwner()

  return (
    <div className="studio-shell">
      <header className="studio-header">
        <Link href="/studio">Keleoz Continuum</Link>
        <div className="studio-owner">
          <span>{owner.username}</span>
          <form action={logoutAction}>
            <button type="submit">Log out</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
