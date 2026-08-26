import { Pool } from 'pg'

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgres://continuum:continuum@127.0.0.1:55432/continuum_test'

export function createTestPool(): Pool {
  return new Pool({
    connectionString: testDatabaseUrl,
    max: 2,
    idleTimeoutMillis: 1_000,
  })
}
