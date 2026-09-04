import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { readBackupManifest, resolveBackupFile, writeBackupManifest } from '../src/modules/operations/backup-store'
import {
  parsePostgresToolConfig,
  pgCountTablesInvocation,
  pgCreateDatabaseInvocation,
  pgDropDatabaseInvocation,
  pgRestoreInvocation,
  redactPostgresError,
} from '../src/modules/operations/postgres-tools'

const root = process.env.CONTINUUM_BACKUP_ROOT?.trim() || join(process.cwd(), 'var', 'backups')
const postgres = parsePostgresToolConfig(process.env)
const manifest = await readBackupManifest(root)
const latest = manifest.backups.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
if (!latest) throw new Error('No backup exists to verify')

const suffix = randomBytes(4).toString('hex')
const temporaryDatabase = `continuum_restore_${Date.now()}_${suffix}`
if (!/^continuum_restore_\d+_[a-f0-9]{8}$/.test(temporaryDatabase)) throw new Error('Unsafe restore database name')

let tableCount: number | null = null
let failure: unknown = null
try {
  const create = pgCreateDatabaseInvocation(postgres, temporaryDatabase)
  execFileSync(create.command, create.args, { stdio: 'pipe' })
  const dump = await readFile(resolveBackupFile(root, latest.file))
  const restore = pgRestoreInvocation(postgres, temporaryDatabase)
  execFileSync(restore.command, restore.args, { input: dump, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 512 * 1024 * 1024 })
  const count = pgCountTablesInvocation(postgres, temporaryDatabase)
  const rawCount = execFileSync(count.command, count.args, { encoding: 'utf8' }).trim()
  tableCount = Number(rawCount)
  if (!Number.isInteger(tableCount) || tableCount < 16) throw new Error(`Restore contains only ${rawCount} public tables`)
} catch (error) {
  failure = error
} finally {
  try {
    const drop = pgDropDatabaseInvocation(postgres, temporaryDatabase)
    execFileSync(drop.command, drop.args, { stdio: 'pipe' })
  } catch (dropError) {
    failure ??= dropError
  }
}

const checkedAt = new Date().toISOString()
const errorText = failure instanceof Error
  ? redactPostgresError(failure.message, postgres.mode === 'direct' ? postgres.databaseUrl : undefined)
  : failure ? 'Unknown restore failure' : null
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
