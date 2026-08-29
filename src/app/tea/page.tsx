import type { Metadata } from 'next'

import { MobileTeaClient } from '@/modules/tea/mobile-tea-client'
import { serverEnv } from '@/shared/env'

export const metadata: Metadata = {
  title: 'Tea',
  description: 'A private browser-local Tea session in Keleoz Continuum.',
}

export default function TeaPage() {
  return (
    <MobileTeaClient
      companionName={serverEnv.AI_COMPANION_NAME}
      maxRequestsPerSession={serverEnv.AI_TEA_MAX_REQUESTS_PER_SESSION}
    />
  )
}
