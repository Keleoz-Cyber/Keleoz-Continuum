import type { Metadata } from 'next'

import { MobileCharacterClient } from '@/modules/character/mobile-character-client'
import { getPublicSiteConfig } from '@/modules/site-config/runtime'

export const metadata: Metadata = {
  title: 'Character',
  description: 'Browser-local Wardrobe and Sleep in Keleoz Continuum.',
}

export default async function CharacterPage() {
  const config=await getPublicSiteConfig()
  return <MobileCharacterClient defaultOutfit={config.roomOutfit}/>
}
