import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '../src/db/schema/index'
import { planBackupRetention, planPortableExportRetention, type BackupKind, type BackupRecord, type PortableExportRecord } from '../src/modules/operations/contracts'
import { readBackupManifest, resolveBackupFile, writeBackupManifest } from '../src/modules/operations/backup-store'
import { createOperationsRepository } from '../src/modules/operations/repository'

const root = process.env.CONTINUUM_BACKUP_ROOT?.trim() || join(process.cwd(), 'var', 'backups')
const container = process.env.CONTINUUM_BACKUP_CONTAINER?.trim() || 'continuum-db'
const database = process.env.CONTINUUM_BACKUP_DB?.trim() || 'continuum'
const databaseUser = process.env.CONTINUUM_BACKUP_USER?.trim() || 'continuum'
const now = new Date()
const stamp = now.toISOString().replaceAll(/[-:.]/g, '').replace('000Z', 'Z')
const allCadences = process.argv.includes('--all-cadences')

function selectedKinds(): BackupKind[] {
  const kinds: BackupKind[] = ['daily']
  if (allCadences || now.getUTCDay() === 1) kinds.push('weekly')
  if (allCadences || now.getUTCDate() === 1) kinds.push('monthly')
  return kinds
}

const dump = execFileSync('docker', [
  'exec', container, 'pg_dump',
  '--username', databaseUser,
  '--dbname', database,
  '--format=custom',
  '--no-owner',
  '--no-privileges',
], { encoding: 'buffer', maxBuffer: 512 * 1024 * 1024 })

const created: BackupRecord[] = []
const kinds = selectedKinds()
for (const kind of kinds) {
  const file = `${kind}/continuum-${stamp}.dump`
  const target = resolveBackupFile(root, file)
  await mkdir(join(root, kind), { recursive: true })
  await writeFile(target, dump, { mode: 0o600 })
  const details = await stat(target)
  created.push({
    kind,
    file,
    createdAt: now.toISOString(),
    byteSize: details.size,
    sha256: createHash('sha256').update(dump).digest('hex'),
  })
}

const manifest = await readBackupManifest(root)
const retention = planBackupRetention([...manifest.backups, ...created])
const readableExports: PortableExportRecord[] = []
if (kinds.includes('weekly')) {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required for the weekly readable export')
  const pool = new Pool({ connectionString: databaseUrl, max: 1 })
  try {
    const ownerResult = await pool.query<{ username: string }>('select username from owners order by created_at asc limit 1')
    const exported = await createOperationsRepository(drizzle(pool, { schema })).createPortableExport({
      ownerUsername: ownerResult.rows[0]?.username ?? null,
      generatedAt: now,
    })
    const body = Buffer.from(`${JSON.stringify(exported, null, 2)}\n`, 'utf8')
    const file = `exports/continuum-${stamp}.json`
    const target = resolveBackupFile(root, file)
    await mkdir(join(root, 'exports'), { recursive: true })
    await writeFile(target, body, { mode: 0o600 })
    readableExports.push({
      file,
      createdAt: now.toISOString(),
      byteSize: body.byteLength,
      sha256: createHash('sha256').update(body).digest('hex'),
    })
  } finally {
    await pool.end()
  }
}
const exportRetention = planPortableExportRetention([...(manifest.exports ?? []), ...readableExports])
for (const record of retention.remove) {
  const target = resolveBackupFile(root, record.file)
  const offset = relative(root, target)
  if (!offset.startsWith('..')) await rm(target, { force: true })
}
for (const record of exportRetention.remove) {
  await rm(resolveBackupFile(root, record.file), { force: true })
}
await writeBackupManifest(root, { ...manifest, backups: retention.keep, exports: exportRetention.keep })

process.stdout.write(`${JSON.stringify({
  created,
  readableExports,
  removed: [...retention.remove, ...exportRetention.remove].map((record) => record.file),
}, null, 2)}\n`)
