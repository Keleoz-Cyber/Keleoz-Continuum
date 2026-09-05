import { requireOwner } from '@/modules/auth/dal'
import { SourcePublicNav } from '@/modules/home/source-public-nav'
import { NativeOwnerFrame } from '@/modules/source-native/frame'

export default async function CalendarPage() {
  await requireOwner('/calendar')
  return <main className="source-public-page"><SourcePublicNav current="calendar" /><NativeOwnerFrame page="calendar" /></main>
}
