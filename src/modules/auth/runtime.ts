import 'server-only'

import { db } from '@/db/client'
import { createAuthRepository } from '@/modules/auth/repository'

export const authRepository = createAuthRepository(db)
