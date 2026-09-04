import { getCurrentOwner } from '@/modules/auth/dal'
import { createOwnerChatHttpHandler } from '@/modules/owner-chat/http'
import { ownerChatService } from '@/modules/owner-chat/runtime'
import { serverEnv } from '@/shared/env'

export const runtime = 'nodejs'

export const POST = createOwnerChatHttpHandler({
  siteOrigin: serverEnv.SITE_ORIGIN,
  getOwner: getCurrentOwner,
  send: (input) => ownerChatService.send(input),
})
