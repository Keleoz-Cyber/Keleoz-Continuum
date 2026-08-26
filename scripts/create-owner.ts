import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '../src/db/schema/index.js'
import { parseOwnerBootstrap } from '../src/modules/auth/bootstrap.js'
import { hashPassword } from '../src/modules/auth/crypto.js'
import { createAuthRepository } from '../src/modules/auth/repository.js'

if (existsSync('.env.local')) {
  loadEnvFile('.env.local')
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const input = parseOwnerBootstrap(process.env)
const pool = new Pool({ connectionString: databaseUrl, max: 1 })

try {
  const repository = createAuthRepository(drizzle(pool, { schema }))
  const passwordHash = await hashPassword(input.password)
  const owner = await repository.createOwner({
    username: input.username,
    passwordHash,
  })

  console.log(`Owner created: ${owner.username}`)
} finally {
  await pool.end()
}
