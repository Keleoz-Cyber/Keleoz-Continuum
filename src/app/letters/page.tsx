import type { Metadata } from 'next'

import { LettersClient } from '@/modules/letters/letters-client'
import { lettersRepository } from '@/modules/letters/runtime'
import { getOriginalLetterArt } from '@/modules/source-native/letter-art'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Letters',
  description: 'Asynchronous correspondence in Keleoz Continuum.',
}

export default async function LettersPage() {
  const letters = await lettersRepository.listPublic()
  return <LettersClient art={getOriginalLetterArt()} letters={letters.map((letter) => ({ ...letter, createdAt: letter.createdAt.toISOString() }))} />
}
