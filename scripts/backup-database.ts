import { createHash, randomUUID } from 'node:crypto'
import { mkdir, rename, rm, rmdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../src/db/schema/index'
import { planBackupRetention, planPortableExportRetention, type BackupKind, type BackupRecord, type PortableExportRecord } from '../src/modules/operations/contracts'
import { readBackupManifest, resolveBackupFile, writeBackupManifest } from '../src/modules/operations/backup-store'
import { parsePostgresToolConfig, pgDumpInvocation } from '../src/modules/operations/postgres-tools'
import { createOperationsRepository } from '../src/modules/operations/repository'
import { assertNoSymlinkPath, copyMediaSnapshot, hashFile, removableBackupBundles } from '../src/modules/operations/media-backup'
import { runPostgresCommand, withPostgresMediaSnapshot } from '../src/modules/operations/media-backup-postgres'

const root = resolve(process.env.CONTINUUM_BACKUP_ROOT?.trim() || join(process.cwd(), 'var', 'backups'))
const postgres = parsePostgresToolConfig(process.env)
const driver = process.env.MEDIA_DRIVER?.trim()
if (driver !== 'local' && driver !== 'lightcos') throw new Error('MEDIA_DRIVER must explicitly be local or lightcos for backup coverage')
const mediaRoot = process.env.MEDIA_LOCAL_ROOT?.trim()
if (driver === 'local' && !mediaRoot) throw new Error('MEDIA_LOCAL_ROOT is required for a local media backup')
const now = new Date()
const bundleId = `${now.toISOString().replaceAll(/[-:.]/g, '')}-${randomUUID()}`
const bundleFile = `bundles/${bundleId}`
const bundlePath = resolveBackupFile(root, bundleFile)
const stage = resolveBackupFile(root, `.pending-${bundleId}`)
const lock = join(root, '.maintenance.lock')
const allCadences = process.argv.includes('--all-cadences')
const kinds: BackupKind[] = ['daily']
if (allCadences || now.getUTCDay() === 1) kinds.push('weekly')
if (allCadences || now.getUTCDate() === 1) kinds.push('monthly')

await assertNoSymlinkPath(root)
await mkdir(root, { recursive: true, mode: 0o700 })
await mkdir(lock) // A stale exclusive lock requires operator inspection, never automatic removal.
let published = false
let promoted = false
try {
  const manifest = await readBackupManifest(root)
  await mkdir(stage, { mode: 0o700 })
  let media: BackupRecord['media']
  const readableExports: PortableExportRecord[] = []
  await withPostgresMediaSnapshot(postgres, async ({ snapshotId, keys }) => {
    await runPostgresCommand(pgDumpInvocation(postgres, snapshotId), { outputFile: join(stage, 'dump.dump') })
    if (driver === 'local') {
      const snapshot = await copyMediaSnapshot(resolve(mediaRoot!), stage, keys)
      await writeFile(join(stage, 'media-manifest.json'), `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
      media = { driver: 'local', file: `${bundleFile}/media-manifest.json`, fileCount: snapshot.files.length,
        ...await hashFile(join(stage, 'media-manifest.json')) }
    } else media = { driver: 'lightcos', status: 'external-not-covered', referencedFileCount: keys.length }
    if (kinds.includes('weekly')) {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) throw new Error('DATABASE_URL is required for the weekly readable export')
      const pool = new Pool({ connectionString: databaseUrl, max: 1 })
      try {
        const client = await pool.connect()
        try {
          // Importing this snapshot also rejects a URL pointing at a different database.
          await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
          await client.query(`SET TRANSACTION SNAPSHOT '${snapshotId}'`)
          const owner = await client.query<{ username: string }>('select username from owners order by created_at asc limit 1')
          const exported = await createOperationsRepository(drizzle(client, { schema })).createPortableExport({ ownerUsername: owner.rows[0]?.username ?? null, generatedAt: now })
          const body = Buffer.from(`${JSON.stringify(exported, null, 2)}\n`, 'utf8')
          await writeFile(join(stage, 'export.json'), body, { flag: 'wx', mode: 0o600 })
          readableExports.push({ file: `${bundleFile}/export.json`, createdAt: now.toISOString(), byteSize: body.byteLength, sha256: createHash('sha256').update(body).digest('hex') })
          await client.query('COMMIT')
        } finally { client.release() }
      } finally { await pool.end() }
    }
  })
  const details = await hashFile(join(stage, 'dump.dump'))
  const created: BackupRecord[] = kinds.map((kind) => ({ kind, file: `${bundleFile}/dump.dump`, createdAt: now.toISOString(), ...details, media }))
  const retention = planBackupRetention([...manifest.backups, ...created])
  const exportRetention = planPortableExportRetention([...(manifest.exports ?? []), ...readableExports])
  await assertNoSymlinkPath(bundlePath)
  await mkdir(join(root, 'bundles'), { recursive: true, mode: 0o700 })
  await rename(stage, bundlePath)
  promoted = true
  // Publish the complete bundle before attempting any retention cleanup.
  await writeBackupManifest(root, { ...manifest, backups: retention.keep, exports: exportRetention.keep })
  published = true
  const removed: string[] = []
  const cleanupWarnings: string[] = []
  const retainedBundleDumps = [...retention.keep.map((record) => record.file), ...exportRetention.keep
    .filter((record) => record.file.startsWith('bundles/')).map((record) => record.file.replace(/\/export\.json$/, '/dump.dump'))]
  const obsoleteBundleDumps = [...retention.remove.map((record) => record.file), ...exportRetention.remove
    .filter((record) => record.file.startsWith('bundles/')).map((record) => record.file.replace(/\/export\.json$/, '/dump.dump'))]
  const targets = [
    ...removableBackupBundles(obsoleteBundleDumps, retainedBundleDumps).map((file) => ({ file, recursive: true })),
    ...[...retention.remove, ...exportRetention.remove].filter((record) => !record.file.startsWith('bundles/'))
      .map((record) => ({ file: record.file, recursive: false })),
  ]
  for (const target of targets) {
    try {
      const path = resolveBackupFile(root, target.file)
      await assertNoSymlinkPath(path)
      await rm(path, { force: true, recursive: target.recursive })
      removed.push(target.file)
    } catch { cleanupWarnings.push(`Retained unreferenced backup path: ${target.file}`) }
  }
  process.stdout.write(`${JSON.stringify({ created, readableExports, removed, cleanupWarnings,
    mediaCoverage: driver === 'local' ? 'local-files-captured' : 'external-not-covered',
    ...(driver === 'lightcos' ? { warning: 'LightCOS object contents are not backed up or downloaded by this command.' } : {}),
  }, null, 2)}\n`)
} finally {
  if (!published) {
    await rm(stage, { recursive: true, force: true })
    if (promoted) await rm(bundlePath, { recursive: true, force: true })
  }
  await rmdir(lock)
}
