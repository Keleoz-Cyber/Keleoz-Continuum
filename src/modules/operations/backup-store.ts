import { constants } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { access, mkdir, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

import { z } from 'zod'

import { emptyBackupManifest, type BackupManifest } from '@/modules/operations/contracts'
import { assertNoSymlinkPath } from '@/modules/operations/media-backup'

const backupRecordSchema = z.object({
  kind: z.enum(['daily', 'weekly', 'monthly']),
  file: z.string().min(1),
  createdAt: z.iso.datetime(),
  byteSize: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  media: z.discriminatedUnion('driver', [
    z.object({ driver: z.literal('local'), file: z.string().min(1), byteSize: z.number().int().nonnegative(), sha256: z.string().regex(/^[a-f0-9]{64}$/), fileCount: z.number().int().nonnegative() }),
    z.object({ driver: z.literal('lightcos'), status: z.literal('external-not-covered'), referencedFileCount: z.number().int().nonnegative() }),
  ]).optional(),
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
    mediaStatus: z.enum(['verified-local', 'external-not-covered', 'legacy-not-covered']).optional(),
    mediaFileCount: z.number().int().nonnegative().optional(),
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
  await assertNoSymlinkPath(path)
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
  const temporary = resolve(root, `manifest.${randomUUID()}.tmp`)
  await assertNoSymlinkPath(path)
  await mkdir(dirname(path), { recursive: true })
  try {
    await writeFile(temporary, `${JSON.stringify(checked, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
    await rename(temporary, path)
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {})
    throw error
  }
}

export async function recordIndependentDownload(root: string, now = new Date()): Promise<void> {
  await assertNoSymlinkPath(root)
  await mkdir(root, { recursive: true })
  const lock = resolve(root, '.maintenance.lock')
  await mkdir(lock)
  try {
    const manifest = await readBackupManifest(root)
    await writeBackupManifest(root, { ...manifest, lastIndependentDownloadAt: now.toISOString() })
  } finally { await rmdir(lock) }
}

export async function backupFileExists(root: string, file: string): Promise<boolean> {
  try {
    await access(resolveBackupFile(root, file), constants.R_OK)
    return true
  } catch {
    return false
  }
}
