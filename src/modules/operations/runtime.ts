import 'server-only'

import { join } from 'node:path'

import { db } from '@/db/client'
import { backupFileExists, readBackupManifest } from '@/modules/operations/backup-store'
import { summarizeBackupManifest } from '@/modules/operations/contracts'
import { createOperationsRepository } from '@/modules/operations/repository'

export const operationsRepository = createOperationsRepository(db)

export function getBackupRoot(): string {
  return process.env.CONTINUUM_BACKUP_ROOT?.trim() || join(process.cwd(), 'var', 'backups')
}

export async function getBackupOverview(now = new Date()) {
  const root = getBackupRoot()
  try {
    const manifest = await readBackupManifest(root)
    const summary = summarizeBackupManifest(manifest, now)
    const latestFileExists = summary.latestBackup
      ? await backupFileExists(root, summary.latestBackup.file)
      : false
    return { ...summary, latestFileExists, manifestError: null }
  } catch {
    return {
      ...summarizeBackupManifest({ schemaVersion: 1, backups: [], lastRestoreDrill: null, lastIndependentDownloadAt: null }, now),
      latestFileExists: false,
      manifestError: 'Backup manifest could not be read.',
    }
  }
}
