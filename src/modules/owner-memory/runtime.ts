import 'server-only'

import { db } from '@/db/client'
import { createOwnerKnowledgeRepository } from '@/modules/owner-memory/repository'

export const ownerKnowledgeRepository = createOwnerKnowledgeRepository(db)
