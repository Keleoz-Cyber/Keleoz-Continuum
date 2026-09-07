import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { afterAll, expect, it } from 'vitest'
import { createTestPool } from '@/test/db'
import { withPostgresMediaSnapshot, runPostgresCommand, readRestoredMediaKeys } from '@/modules/operations/media-backup-postgres'
import { pgCreateDatabaseInvocation, pgDropDatabaseInvocation, pgDumpInvocation, pgRestoreInvocation } from '@/modules/operations/postgres-tools'

const pool = createTestPool()
afterAll(() => pool.end())
it('holds one DB snapshot for ready media inventory and pg_dump despite a concurrent committed upload', async () => {
  const actual = await pool.query<{ name: string }>('select current_database() as name')
  if (actual.rows[0].name !== 'continuum_test') throw new Error('This test only permits continuum_test')
  const config = { mode: 'docker' as const, container: 'continuum-db', database: 'continuum_test', user: 'continuum' }
  const root = await mkdtemp(join(tmpdir(), 'continuum-backup-postgres-test-'))
  const id = randomUUID()
  const key = `backup-test/${id}.webp`
  const restoreDb = `continuum_restore_${Date.now()}_${id.replaceAll('-', '').slice(0, 8)}`
  let created = false
  try {
    await withPostgresMediaSnapshot(config, async ({ snapshotId, keys }) => {
      expect(keys).not.toContain(key)
      await pool.query("insert into media_objects (id,storage_key,original_name,mime_type,byte_size,sha256,state) values ($1,$2,'backup-test.webp','image/webp',1,$3,'ready')", [id, key, 'a'.repeat(64)])
      await runPostgresCommand(pgDumpInvocation(config, snapshotId), { outputFile: join(root, 'dump') })
    })
    await runPostgresCommand(pgCreateDatabaseInvocation(config, restoreDb))
    created = true
    await runPostgresCommand(pgRestoreInvocation(config, restoreDb), { inputFile: join(root, 'dump') })
    expect(await readRestoredMediaKeys(config, restoreDb)).not.toContain(key)
    expect((await pool.query('select id from media_objects where id=$1', [id])).rowCount).toBe(1)
  } finally {
    if (created) await runPostgresCommand(pgDropDatabaseInvocation(config, restoreDb))
    await pool.query('delete from media_objects where id=$1', [id])
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)

it('publishes paired local bundles only on success and verifies media solely in an isolated restore', async () => {
  if ((await pool.query('select current_database() as name')).rows[0].name !== 'continuum_test') throw new Error('Unsafe test database')
  const root = await mkdtemp(join(tmpdir(), 'continuum-backup-cli-test-'))
  const id = randomUUID()
  const key = `backup-test/${id}.txt`
  const execute = promisify(execFile)
  const env = { ...process.env, CONTINUUM_BACKUP_ROOT: join(root, 'backups'), CONTINUUM_BACKUP_MODE: 'docker',
    CONTINUUM_BACKUP_CONTAINER: 'continuum-db', CONTINUUM_BACKUP_DB: 'continuum_test', CONTINUUM_BACKUP_USER: 'continuum',
    DATABASE_URL: 'postgres://continuum:continuum@127.0.0.1:55432/continuum_test', MEDIA_DRIVER: 'local', MEDIA_LOCAL_ROOT: join(root, 'source') }
  try {
    await pool.query("insert into media_objects (id,storage_key,original_name,mime_type,byte_size,sha256,state) values ($1,$2,'backup-test.txt','text/plain',1,$3,'ready')", [id, key, 'a'.repeat(64)])
    await withPostgresMediaSnapshot({ mode: 'docker', container: 'continuum-db', database: 'continuum_test', user: 'continuum' }, async ({ keys }) => {
      for (const file of keys) {
        await mkdir(dirname(join(root, 'source', file)), { recursive: true })
        await writeFile(join(root, 'source', file), file)
      }
    })
    await execute(process.execPath, ['--import', 'tsx', 'scripts/backup-database.ts', '--all-cadences'], { env })
    const manifestPath = join(root, 'backups', 'manifest.json')
    const before = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(before)
    expect(manifest.backups).toHaveLength(3)
    expect(new Set(manifest.backups.map((item: { file: string }) => item.file)).size).toBe(1)
    expect(manifest.backups[0].media.driver).toBe('local')
    await rm(join(root, 'source', key))
    await expect(execute(process.execPath, ['--import', 'tsx', 'scripts/backup-database.ts'], { env })).rejects.toThrow()
    expect(await readFile(manifestPath, 'utf8')).toBe(before)
    // Missing live file cannot affect verification of a complete historical bundle.
    const verification = await execute(process.execPath, ['--import', 'tsx', 'scripts/verify-database-backup.ts'], { env })
    expect(JSON.parse(verification.stdout).mediaStatus).toBe('verified-local')
    await expect(readFile(join(root, 'source', key))).rejects.toThrow()
    const metadata = JSON.parse(await readFile(join(root, 'backups', manifest.backups[0].media.file), 'utf8'))
    expect(metadata.files.some((file: { key: string }) => file.key === key)).toBe(true)
    await writeFile(join(root, 'backups', dirname(manifest.backups[0].file), 'media', key), 'corrupt fixture')
    await expect(execute(process.execPath, ['--import', 'tsx', 'scripts/verify-database-backup.ts'], { env })).rejects.toThrow('Media backup integrity')
    expect(JSON.parse(await readFile(manifestPath, 'utf8')).lastRestoreDrill.status).toBe('failed')
    await writeFile(join(root, 'backups', manifest.backups[0].file), 'corrupt dump')
    await expect(execute(process.execPath, ['--import', 'tsx', 'scripts/verify-database-backup.ts'], { env })).rejects.toThrow('Database backup integrity')
    const external = await execute(process.execPath, ['--import', 'tsx', 'scripts/backup-database.ts'], { env: { ...env, MEDIA_DRIVER: 'lightcos' } })
    expect(JSON.parse(external.stdout).mediaCoverage).toBe('external-not-covered')
    const externalVerification = await execute(process.execPath, ['--import', 'tsx', 'scripts/verify-database-backup.ts'], { env })
    expect(JSON.parse(externalVerification.stdout).mediaStatus).toBe('external-not-covered')
  } finally {
    await pool.query('delete from media_objects where id=$1', [id])
    await rm(root, { recursive: true, force: true })
  }
}, 60_000)
