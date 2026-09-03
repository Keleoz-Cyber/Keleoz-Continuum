import { constants } from 'node:fs'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

import { z } from 'zod'

import { emptyBackupManifest, type BackupManifest } from '@/modules/operations/contracts'

const backupRecordSchema = z.object({
  kind: z.enum(['daily', 'weekly', 'monthly']),
  file: z.string().min(1),
  createdAt: z.iso.datetime(),
  byteSize: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})

const portableExportRecordSchema = z.object({
  file: z.string().min(1),
  createdAt: z.iso.datetime(),
  byteSize: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})

const backupManifestSchema = z.object({
  schemaVersion: z.literal(1),
  backups: z.array(backupRecordSchema),
  exports: z.array(portableExportRecordSchema).default([]),
  lastRestoreDrill: z.object({
    status: z.enum(['passed', 'failed']),
    backupFile: z.string().min(1),
    checkedAt: z.iso.datetime(),
    tableCount: z.number().int().nonnegative().nullable(),
    error: z.string().nullable(),
  }).nullable(),
  lastIndependentDownloadAt: z.iso.datetime().nullable(),
})

export function resolveBackupFile(root: string, file: string): string {
  if (isAbsolute(file)) throw new Error('Backup path is outside the configured root')
  const resolvedRoot = resolve(root)
  const target = resolve(resolvedRoot, file)
  const offset = relative(resolvedRoot, target)
  if (!offset || offset.startsWith('..') || isAbsolute(offset)) {
    throw new Error('Backup path is outside the configured root')
  }
  return target
}

export async function readBackupManifest(root: string): Promise<BackupManifest> {
  const path = resolve(root, 'manifest.json')
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown
    return backupManifestSchema.parse(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyBackupManifest()
    throw error
  }
}

export async function writeBackupManifest(root: string, manifest: BackupManifest): Promise<void> {
  const checked = backupManifestSchema.parse(manifest)
  const path = resolve(root, 'manifest.json')
  const temporary = resolve(root, 'manifest.json.tmp')
  await mkdir(dirname(path), { recursive: true })
  await writeFile(temporary, `${JSON.stringify(checked, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, path)
}

export async function recordIndependentDownload(root: string, now = new Date()): Promise<void> {
  const manifest = await readBackupManifest(root)
  await writeBackupManifest(root, { ...manifest, lastIndependentDownloadAt: now.toISOString() })
}

export async function backupFileExists(root: string, file: string): Promise<boolean> {
  try {
    await access(resolveBackupFile(root, file), constants.R_OK)
    return true
  } catch {
    return false
  }
}
