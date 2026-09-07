import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rm, rmdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { readBackupManifest, resolveBackupFile, writeBackupManifest } from '../src/modules/operations/backup-store'
import { parsePostgresToolConfig, pgCountTablesInvocation, pgCreateDatabaseInvocation, pgDropDatabaseInvocation, pgRestoreInvocation } from '../src/modules/operations/postgres-tools'
import { assertNoSymlinkPath, hashFile, mediaSnapshotSchema, restoreMediaSnapshot } from '../src/modules/operations/media-backup'
import { readRestoredMediaKeys, runPostgresCommand } from '../src/modules/operations/media-backup-postgres'
import type { RestoreDrillRecord } from '../src/modules/operations/contracts'

const root = resolve(process.env.CONTINUUM_BACKUP_ROOT?.trim() || join(process.cwd(), 'var', 'backups'))
const postgres = parsePostgresToolConfig(process.env)
await assertNoSymlinkPath(root)
const lock = join(root, '.maintenance.lock')
await mkdir(lock)
try {
  const manifest = await readBackupManifest(root)
  const latest = manifest.backups.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
  if (!latest) throw new Error('No backup exists to verify')
  const temporaryDatabase = `continuum_restore_${Date.now()}_${randomBytes(4).toString('hex')}`
  let createdDatabase = false
  let mediaDirectory: string | undefined
  let tableCount: number | null = null
  let failure: unknown = null
  let mediaStatus: RestoreDrillRecord['mediaStatus'] = latest.media?.driver === 'lightcos' ? 'external-not-covered' : 'legacy-not-covered'
  let mediaFileCount = 0
  try {
    const dumpFile = resolveBackupFile(root, latest.file)
    const dumpHash = await hashFile(dumpFile)
    if (dumpHash.sha256 !== latest.sha256 || dumpHash.byteSize !== latest.byteSize) throw new Error('Database backup integrity check failed')
    await runPostgresCommand(pgCreateDatabaseInvocation(postgres, temporaryDatabase))
    createdDatabase = true
    await runPostgresCommand(pgRestoreInvocation(postgres, temporaryDatabase), { inputFile: dumpFile })
    const rawCount = (await runPostgresCommand(pgCountTablesInvocation(postgres, temporaryDatabase))).trim()
    tableCount = Number(rawCount)
    if (!Number.isInteger(tableCount) || tableCount < 16) throw new Error('Restore contains fewer than 16 public tables')
    if (latest.media?.driver === 'local') {
      const metadata = resolveBackupFile(root, latest.media.file)
      if (dirname(metadata) !== dirname(dumpFile)) throw new Error('Media snapshot is not paired with this database dump')
      const details = await hashFile(metadata)
      if (details.sha256 !== latest.media.sha256 || details.byteSize !== latest.media.byteSize || details.byteSize > 64 * 1024 * 1024) throw new Error('Media manifest integrity check failed')
      const snapshot = mediaSnapshotSchema.parse(JSON.parse(await readFile(metadata, 'utf8')))
      const required = (await readRestoredMediaKeys(postgres, temporaryDatabase)).sort()
      const captured = snapshot.files.map((file) => file.key).sort()
      if (snapshot.files.length !== latest.media.fileCount || JSON.stringify(required) !== JSON.stringify(captured)) throw new Error('Media snapshot does not cover the restored database references')
      const restored = await restoreMediaSnapshot(dirname(metadata), snapshot)
      mediaDirectory = restored.directory
      mediaFileCount = restored.fileCount
      mediaStatus = 'verified-local'
    }
  } catch (error) { failure = error }
  finally {
    if (createdDatabase) {
      try { await runPostgresCommand(pgDropDatabaseInvocation(postgres, temporaryDatabase)) }
      catch (error) { failure ??= error }
    }
    if (mediaDirectory) {
      try { await rm(mediaDirectory, { recursive: true, force: true }) }
      catch (error) { failure ??= error }
    }
  }
  const checkedAt = new Date().toISOString()
  const drill: RestoreDrillRecord = { status: failure ? 'failed' : 'passed', backupFile: latest.file, checkedAt,
    tableCount, mediaStatus, mediaFileCount, error: failure ? 'Isolated database/media verification failed; inspect local command output.' : null }
  await writeBackupManifest(root, { ...manifest, lastRestoreDrill: drill })
  if (failure) throw failure
  process.stdout.write(`${JSON.stringify({ ...drill,
    ...(mediaStatus !== 'verified-local' ? { warning: 'Database restore passed; external or legacy media contents are not covered.' } : {}),
  }, null, 2)}\n`)
} finally { await rmdir(lock) }
