import { serverEnv } from '@/shared/env'
import { createTeaHttpHandler } from '@/modules/tea/http'
import { teaService } from '@/modules/tea/runtime'

export const runtime = 'nodejs'

export const POST = createTeaHttpHandler({
  siteOrigin: serverEnv.SITE_ORIGIN,
  fingerprintSecret: serverEnv.SESSION_SECRET,
  service: teaService,
  async getClientAddress(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
  },
})
