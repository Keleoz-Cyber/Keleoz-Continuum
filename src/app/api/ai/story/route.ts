import { serverEnv } from '@/shared/env'
import { createStoryHttpHandler } from '@/modules/story/http'
import { storyService } from '@/modules/story/runtime'
import { getTrustedProxyClientAddress } from '@/shared/same-origin'

export const runtime = 'nodejs'

export const POST = createStoryHttpHandler({
  siteOrigin: serverEnv.SITE_ORIGIN,
  fingerprintSecret: serverEnv.SESSION_SECRET,
  service: storyService,
  async getClientAddress(request) {
    return getTrustedProxyClientAddress(request.headers)
  },
})
