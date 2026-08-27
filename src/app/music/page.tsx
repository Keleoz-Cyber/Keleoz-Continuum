import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Music',
  description: 'A quiet local music room in Keleoz Continuum.',
}

export default function MusicPage() {
  redirect('/?openMusic=1')
}
