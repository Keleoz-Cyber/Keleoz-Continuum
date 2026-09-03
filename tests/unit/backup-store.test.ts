import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { emptyBackupManifest } from '@/modules/operations/contracts'
import {
  readBackupManifest,
  recordIndependentDownload,
  resolveBackupFile,
  writeBackupManifest,
} from '@/modules/operations/backup-store'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('backup manifest store', () => {
  it('returns an honest empty state until the first backup exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'continuum-backup-'))
    roots.push(root)

    await expect(readBackupManifest(root)).resolves.toEqual(emptyBackupManifest())
  })

  it('upgrades a pre-export manifest with an empty readable-export list', async () => {
    const root = await mkdtemp(join(tmpdir(), 'continuum-backup-'))
    roots.push(root)
    await writeFile(join(root, 'manifest.json'), JSON.stringify({
      schemaVersion: 1,
      backups: [],
      lastRestoreDrill: null,
      lastIndependentDownloadAt: null,
    }))

    await expect(readBackupManifest(root)).resolves.toMatchObject({ exports: [] })
  })

  it('writes and rereads a versioned manifest atomically', async () => {
    const root = await mkdtemp(join(tmpdir(), 'continuum-backup-'))
    roots.push(root)
    const manifest = {
      ...emptyBackupManifest(),
      backups: [{
        kind: 'daily' as const,
        file: 'daily/continuum-20260903T103000Z.dump',
        createdAt: '2026-09-03T10:30:00.000Z',
        byteSize: 42,
        sha256: 'a'.repeat(64),
      }],
    }

    await writeBackupManifest(root, manifest)

    await expect(readBackupManifest(root)).resolves.toEqual(manifest)
  })

  it('rejects traversal and absolute paths before deletion or restore', () => {
    expect(() => resolveBackupFile('D:\\safe\\backups', '..\\outside.dump')).toThrow('outside')
    expect(() => resolveBackupFile('D:\\safe\\backups', 'C:\\outside.dump')).toThrow('outside')
    expect(resolveBackupFile('D:\\safe\\backups', 'daily\\safe.dump')).toBe('D:\\safe\\backups\\daily\\safe.dump')
  })

  it('records an independent export download without inventing a backup', async () => {
    const root = await mkdtemp(join(tmpdir(), 'continuum-backup-'))
    roots.push(root)

    await recordIndependentDownload(root, new Date('2026-09-03T10:30:00.000Z'))

    await expect(readBackupManifest(root)).resolves.toMatchObject({
      backups: [],
      lastIndependentDownloadAt: '2026-09-03T10:30:00.000Z',
    })
  })
})
