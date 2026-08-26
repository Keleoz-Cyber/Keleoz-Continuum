import type { Metadata } from 'next'

import { LettersClient } from '@/modules/letters/letters-client'
import { lettersRepository } from '@/modules/letters/runtime'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Letters',
  description: 'Asynchronous correspondence in Keleoz Continuum.',
}

export default async function LettersPage() {
  const letters = await lettersRepository.listPublic()
  return <LettersClient letters={letters.map((letter) => ({ ...letter, createdAt: letter.createdAt.toISOString() }))} />
}
