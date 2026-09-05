import { requireOwner } from '@/modules/auth/dal'
import { SourcePublicNav } from '@/modules/home/source-public-nav'
import { NativeOwnerFrame } from '@/modules/source-native/frame'

export default async function MemoryPage() {
  await requireOwner('/memory')
  return <main className="source-public-page"><SourcePublicNav current="memory" /><NativeOwnerFrame page="memory" /></main>
}
