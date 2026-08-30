import type { Metadata } from 'next'

import { MobileCharacterClient } from '@/modules/character/mobile-character-client'

export const metadata: Metadata = {
  title: 'Character',
  description: 'Browser-local Wardrobe and Sleep in Keleoz Continuum.',
}

export default function CharacterPage() {
  return <MobileCharacterClient />
}
