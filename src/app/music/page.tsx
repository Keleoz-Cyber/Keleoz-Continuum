import type { Metadata } from 'next'

import { MusicClient } from '@/modules/music/music-client'

export const metadata: Metadata = {
  title: 'Music',
  description: 'A quiet local music room in Keleoz Continuum.',
}

export default function MusicPage() {
  return <MusicClient />
}
