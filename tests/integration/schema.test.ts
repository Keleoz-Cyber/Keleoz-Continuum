import { afterAll, describe, expect, it } from 'vitest'

import { createTestPool } from '@/test/db'

const pool = createTestPool()

afterAll(async () => {
  await pool.end()
})

describe('database schema', () => {
  it('creates the seven foundation tables', async () => {
    const result = await pool.query<{ table_name: string }>(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `)

    expect(result.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'owners',
        'sessions',
        'login_throttles',
        'content_entries',
        'content_versions',
        'content_publications',
        'media_objects',
      ]),
    )
  })

  it('creates the required uniqueness contracts', async () => {
    const result = await pool.query<{ tablename: string; indexdef: string }>(`
      select tablename, indexdef
      from pg_indexes
      where schemaname = 'public'
        and tablename in ('owners', 'content_entries', 'content_versions')
      order by tablename, indexname
    `)
    const definitions = result.rows.map((row) => `${row.tablename}: ${row.indexdef}`).join('\n')

    expect(definitions).toContain('owners')
    expect(definitions).toContain('(username)')
    expect(definitions).toContain('content_entries')
    expect(definitions).toContain('(slug)')
    expect(definitions).toContain('content_versions')
    expect(definitions).toContain('(entry_id, version_number)')
  })
})
