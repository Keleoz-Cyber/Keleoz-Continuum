import Link from 'next/link'

import { logoutAction } from '@/modules/auth/actions'
import { requireOwner } from '@/modules/auth/dal'

export const dynamic = 'force-dynamic'

export default async function ProtectedStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const owner = await requireOwner()

  return (
    <div className="studio-shell source-studio">
      <header className="studio-header">
        <div className="studio-header-links">
          <Link className="source-studio-brand" href="/studio"><span>◇</span> KC</Link>
          <nav aria-label="Studio navigation"><Link href="/studio">Studio</Link><Link href="/studio/chat">Chat</Link><Link href="/studio/memory">Memory</Link><Link href="/studio/operations">System</Link><Link href="/">View site</Link></nav>
        </div>
        <div className="studio-owner">
          <span><i>{owner.username.slice(0, 1).toUpperCase()}</i>{owner.username}</span>
          <form action={logoutAction}>
            <button type="submit">Log out</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
