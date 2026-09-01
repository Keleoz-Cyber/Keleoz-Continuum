import 'server-only'

import { db } from '@/db/client'
import { createMediaRepository } from '@/modules/media/repository'
import { createMediaService } from '@/modules/media/service'
import { createLightCosMediaStorage, createLocalMediaStorage } from '@/modules/media/storage'
import { serverEnv } from '@/shared/env'

export const mediaStorage = serverEnv.MEDIA_DRIVER === 'lightcos'
  ? createLightCosMediaStorage({
      secretId: serverEnv.MEDIA_LIGHTCOS_SECRET_ID!,
      secretKey: serverEnv.MEDIA_LIGHTCOS_SECRET_KEY!,
      bucket: serverEnv.MEDIA_LIGHTCOS_BUCKET!,
      publicOrigin: serverEnv.MEDIA_PUBLIC_ORIGIN!,
    })
  : createLocalMediaStorage({ root: serverEnv.MEDIA_LOCAL_ROOT })

export const mediaRepository = createMediaRepository(db)
export const mediaService = createMediaService({ repository: mediaRepository, storage: mediaStorage })
