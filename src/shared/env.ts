import 'server-only'

import { parseServerEnv } from '@/shared/env-schema'

export const serverEnv = parseServerEnv(process.env)
