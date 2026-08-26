import 'server-only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '@/db/schema'
import { serverEnv } from '@/shared/env'

const globalDatabase = globalThis as typeof globalThis & {
  continuumPool?: Pool
}

export const pool =
  globalDatabase.continuumPool ??
  new Pool({
    connectionString: serverEnv.DATABASE_URL,
    max: 8,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 5_000,
  })

if (serverEnv.NODE_ENV !== 'production') {
  globalDatabase.continuumPool = pool
}

export const db = drizzle(pool, { schema })
