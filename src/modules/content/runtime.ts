import 'server-only'

import { db } from '@/db/client'
import { createContentRepository } from '@/modules/content/repository'

export const contentRepository = createContentRepository(db)
