import { describe, expect, it } from 'vitest'

import {
  calculateMeasuredAiCostMicroUsd,
  describeLatestBackupStatus,
  describeMediaCoverage,
  planBackupRetention,
  planPortableExportRetention,
  summarizeBackupManifest,
} from '@/modules/operations/contracts'

describe('operations contracts', () => {
  it('does not confuse an older DB drill with current complete media coverage', () => {
    const latest = { kind: 'daily' as const, file: 'new.dump', createdAt: '2026-09-07T00:00:00Z', byteSize: 1, sha256: 'a'.repeat(64) }
    expect(summarizeBackupManifest({ schemaVersion: 1, backups: [latest], lastRestoreDrill: { status: 'passed', backupFile: 'old.dump', checkedAt: '2026-09-06T00:00:00Z', tableCount: 20, error: null }, lastIndependentDownloadAt: null }).restoreVerified).toBe(false)
    expect(describeMediaCoverage(latest)).toContain('未包含媒体')
    expect(describeMediaCoverage({ ...latest, media: { driver: 'lightcos', status: 'external-not-covered', referencedFileCount: 2 } })).toContain('未备份')
    expect(describeMediaCoverage({ ...latest, media: { driver: 'local', file: 'media.json', byteSize: 1, sha256: latest.sha256, fileCount: 3 } })).toContain('3')
  })
  it('calculates measured provider cost from completed token counts only', () => {
    expect(calculateMeasuredAiCostMicroUsd({
      promptTokens: 1_250,
      completionTokens: 375,
      inputMicroUsdPerMillionTokens: 200_000,
      outputMicroUsdPerMillionTokens: 800_000,
    })).toBe(550)
    expect(calculateMeasuredAiCostMicroUsd({
      promptTokens: null,
      completionTokens: null,
      inputMicroUsdPerMillionTokens: 200_000,
      outputMicroUsdPerMillionTokens: 800_000,
    })).toBe(0)
  })

  it('keeps the newest bounded daily, weekly and monthly backup records', () => {
    const records = [
      ...Array.from({ length: 9 }, (_, index) => ({ kind: 'daily' as const, file: `daily-${index}.dump`, createdAt: `2026-09-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`, byteSize: 1, sha256: `${index}` })),
      ...Array.from({ length: 6 }, (_, index) => ({ kind: 'weekly' as const, file: `weekly-${index}.dump`, createdAt: `2026-08-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`, byteSize: 1, sha256: `w${index}` })),
      ...Array.from({ length: 8 }, (_, index) => ({ kind: 'monthly' as const, file: `monthly-${index}.dump`, createdAt: `2026-${String(index + 1).padStart(2, '0')}-01T00:00:00.000Z`, byteSize: 1, sha256: `m${index}` })),
    ]

    const plan = planBackupRetention(records)

    expect(plan.keep.filter((item) => item.kind === 'daily')).toHaveLength(7)
    expect(plan.keep.filter((item) => item.kind === 'weekly')).toHaveLength(4)
    expect(plan.keep.filter((item) => item.kind === 'monthly')).toHaveLength(6)
    expect(plan.remove).toHaveLength(6)
    expect(plan.keep.some((item) => item.file === 'daily-8.dump')).toBe(true)
  })

  it('reports an overdue independent-download reminder without claiming a backup passed', () => {
    const summary = summarizeBackupManifest({
      schemaVersion: 1,
      backups: [],
      lastRestoreDrill: null,
      lastIndependentDownloadAt: '2026-07-01T00:00:00.000Z',
    }, new Date('2026-09-03T00:00:00.000Z'))

    expect(summary.latestBackup).toBeNull()
    expect(summary.restoreVerified).toBe(false)
    expect(summary.independentDownloadDue).toBe(true)
  })

  it('describes a present backup file instead of showing the empty-state instruction', () => {
    const record = {
      kind: 'daily' as const,
      file: 'daily/continuum.dump',
      createdAt: '2026-09-03T00:00:00.000Z',
      byteSize: 43_893,
      sha256: '22a273c5fcd6d744a864ec4128fdd4633749a372717621ea73b0a83668585754',
    }

    expect(describeLatestBackupStatus(record, true)).toBe('42.9 KB · SHA-256 22a273c5fcd6…')
    expect(describeLatestBackupStatus(record, false)).toBe('Manifest exists, but its latest file is missing.')
    expect(describeLatestBackupStatus(null, false)).toBe('Run the server backup command to create the first compressed snapshot.')
  })

  it('retains the newest four weekly readable exports', () => {
    const records = Array.from({ length: 6 }, (_, index) => ({
      file: `exports/continuum-${index}.json`,
      createdAt: `2026-0${index + 1}-01T00:00:00.000Z`,
      byteSize: index + 1,
      sha256: `${index}`.repeat(64),
    }))

    const plan = planPortableExportRetention(records)

    expect(plan.keep.map((record) => record.file)).toEqual([
      'exports/continuum-5.json',
      'exports/continuum-4.json',
      'exports/continuum-3.json',
      'exports/continuum-2.json',
    ])
    expect(plan.remove).toHaveLength(2)
  })
})
