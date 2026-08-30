import type { Metadata } from 'next'

import { MobileStoryClient } from '@/modules/story/mobile-story-client'
import { serverEnv } from '@/shared/env'

export const metadata: Metadata = {
  title: 'Story',
  description: 'A browser-local interactive Story in Keleoz Continuum.',
}

export default function StoryPage() {
  return (
    <MobileStoryClient
      companionName={serverEnv.AI_COMPANION_NAME}
      maxRequestsPerSession={serverEnv.AI_STORY_MAX_REQUESTS_PER_SESSION}
    />
  )
}
