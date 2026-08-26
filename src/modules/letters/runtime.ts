import 'server-only'

import { db } from '@/db/client'
import { createLettersRepository } from '@/modules/letters/repository'

export const lettersRepository = createLettersRepository(db)
