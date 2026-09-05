import { requireOwner } from '@/modules/auth/dal'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export const dynamic = 'force-dynamic'

export default async function ProtectedStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const owner = await requireOwner()

  return (
    <div className="studio-shell source-studio source-public-page">
      <div className="source-public-bg" aria-hidden="true" />
      <SourcePublicNav current="studio" owner={owner.username} />
      {children}
    </div>
  )
}
