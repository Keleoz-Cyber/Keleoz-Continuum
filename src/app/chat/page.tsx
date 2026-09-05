import { requireOwner } from '@/modules/auth/dal'
import { SourcePublicNav } from '@/modules/home/source-public-nav'
import { NativeOwnerFrame } from '@/modules/source-native/frame'

export default async function ChatPage() {
  await requireOwner('/chat')
  return <main className="source-public-page"><SourcePublicNav current="chat" /><NativeOwnerFrame page="chat" /></main>
}
