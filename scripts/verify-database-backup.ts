import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { readBackupManifest, resolveBackupFile, writeBackupManifest } from '../src/modules/operations/backup-store'

const root = process.env.CONTINUUM_BACKUP_ROOT?.trim() || join(process.cwd(), 'var', 'backups')
const container = process.env.CONTINUUM_BACKUP_CONTAINER?.trim() || 'continuum-db'
const databaseUser = process.env.CONTINUUM_BACKUP_USER?.trim() || 'continuum'
const manifest = await readBackupManifest(root)
const latest = manifest.backups.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
if (!latest) throw new Error('No backup exists to verify')

const suffix = randomBytes(4).toString('hex')
const temporaryDatabase = `continuum_restore_${Date.now()}_${suffix}`
if (!/^continuum_restore_\d+_[a-f0-9]{8}$/.test(temporaryDatabase)) throw new Error('Unsafe restore database name')

let tableCount: number | null = null
let failure: unknown = null
try {
  execFileSync('docker', ['exec', container, 'createdb', '--username', databaseUser, temporaryDatabase], { stdio: 'pipe' })
  const dump = await readFile(resolveBackupFile(root, latest.file))
  execFileSync('docker', [
    'exec', '-i', container, 'pg_restore',
    '--username', databaseUser,
    '--dbname', temporaryDatabase,
    '--exit-on-error',
    '--no-owner',
    '--no-privileges',
  ], { input: dump, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 512 * 1024 * 1024 })
  const rawCount = execFileSync('docker', [
    'exec', container, 'psql', '--username', databaseUser, '--dbname', temporaryDatabase,
    '--tuples-only', '--no-align', '--command', "select count(*) from information_schema.tables where table_schema='public'",
  ], { encoding: 'utf8' }).trim()
  tableCount = Number(rawCount)
  if (!Number.isInteger(tableCount) || tableCount < 16) throw new Error(`Restore contains only ${rawCount} public tables`)
} catch (error) {
  failure = error
} finally {
  try {
    execFileSync('docker', ['exec', container, 'dropdb', '--username', databaseUser, '--if-exists', temporaryDatabase], { stdio: 'pipe' })
  } catch (dropError) {
    failure ??= dropError
  }
}

const checkedAt = new Date().toISOString()
const errorText = failure instanceof Error ? failure.message.slice(0, 400) : failure ? 'Unknown restore failure' : null
await writeBackupManifest(root, {
  ...manifest,
  lastRestoreDrill: {
    status: failure ? 'failed' : 'passed',
    backupFile: latest.file,
    checkedAt,
    tableCount,
    error: errorText,
  },
})
if (failure) throw failure
process.stdout.write(`${JSON.stringify({ status: 'passed', backupFile: latest.file, checkedAt, tableCount }, null, 2)}\n`)
