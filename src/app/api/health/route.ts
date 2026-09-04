import { pool } from '@/db/client'
import { createHealthHttpHandler } from '@/modules/operations/health-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const startedAt = new Date()

export const GET = createHealthHttpHandler({
  startedAt,
  async checkDatabase() {
    await pool.query('select 1')
  },
})
