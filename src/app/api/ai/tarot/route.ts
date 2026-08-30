import { createTarotHttpHandler } from '@/modules/tarot/http'
import { tarotService } from '@/modules/tarot/runtime'
import { serverEnv } from '@/shared/env'
import { getTrustedProxyClientAddress } from '@/shared/same-origin'
export const runtime='nodejs'
export const POST=createTarotHttpHandler({siteOrigin:serverEnv.SITE_ORIGIN,fingerprintSecret:serverEnv.SESSION_SECRET,service:tarotService,async getClientAddress(request){return getTrustedProxyClientAddress(request.headers)}})
