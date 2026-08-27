import type { Metadata } from 'next'

import { SourceMusicClient } from '@/modules/music/source-music-client'

export const metadata: Metadata = {
  title: 'Music',
  description: 'A quiet local music room in Keleoz Continuum.',
}

export default function MusicPage() {
  return <SourceMusicClient />
}
