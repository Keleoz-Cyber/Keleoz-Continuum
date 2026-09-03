export type BackupKind = 'daily' | 'weekly' | 'monthly'

export type BackupRecord = {
  kind: BackupKind
  file: string
  createdAt: string
  byteSize: number
  sha256: string
}

export type RestoreDrillRecord = {
  status: 'passed' | 'failed'
  backupFile: string
  checkedAt: string
  tableCount: number | null
  error: string | null
}

export type PortableExportRecord = {
  file: string
  createdAt: string
  byteSize: number
  sha256: string
}

export type BackupManifest = {
  schemaVersion: 1
  backups: BackupRecord[]
  exports?: PortableExportRecord[]
  lastRestoreDrill: RestoreDrillRecord | null
  lastIndependentDownloadAt: string | null
}

const RETENTION: Record<BackupKind, number> = { daily: 7, weekly: 4, monthly: 6 }
const MONTH_MS = 31 * 24 * 60 * 60 * 1_000

export function calculateMeasuredAiCostMicroUsd(input: {
  promptTokens: number | null
  completionTokens: number | null
  inputMicroUsdPerMillionTokens: number
  outputMicroUsdPerMillionTokens: number
}): number {
  const inputCost = (input.promptTokens ?? 0) * input.inputMicroUsdPerMillionTokens / 1_000_000
  const outputCost = (input.completionTokens ?? 0) * input.outputMicroUsdPerMillionTokens / 1_000_000
  return Math.ceil(inputCost + outputCost)
}

export function planBackupRetention(records: BackupRecord[]): { keep: BackupRecord[]; remove: BackupRecord[] } {
  const keep: BackupRecord[] = []
  const remove: BackupRecord[] = []
  for (const kind of ['daily', 'weekly', 'monthly'] as const) {
    const sorted = records
      .filter((record) => record.kind === kind)
      .toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))
    keep.push(...sorted.slice(0, RETENTION[kind]))
    remove.push(...sorted.slice(RETENTION[kind]))
  }
  return { keep, remove }
}

export function planPortableExportRetention(records: PortableExportRecord[]): { keep: PortableExportRecord[]; remove: PortableExportRecord[] } {
  const sorted = records.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))
  return { keep: sorted.slice(0, 4), remove: sorted.slice(4) }
}

export function emptyBackupManifest(): BackupManifest {
  return { schemaVersion: 1, backups: [], exports: [], lastRestoreDrill: null, lastIndependentDownloadAt: null }
}

export function summarizeBackupManifest(manifest: BackupManifest, now = new Date()) {
  const latestBackup = manifest.backups.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
  const portableExports = manifest.exports ?? []
  const latestPortableExport = portableExports.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
  const lastDownloadAt = manifest.lastIndependentDownloadAt
    ? new Date(manifest.lastIndependentDownloadAt)
    : null
  return {
    latestBackup,
    latestPortableExport,
    portableExportCount: portableExports.length,
    counts: {
      daily: manifest.backups.filter((record) => record.kind === 'daily').length,
      weekly: manifest.backups.filter((record) => record.kind === 'weekly').length,
      monthly: manifest.backups.filter((record) => record.kind === 'monthly').length,
    },
    lastRestoreDrill: manifest.lastRestoreDrill,
    restoreVerified: manifest.lastRestoreDrill?.status === 'passed',
    lastIndependentDownloadAt: manifest.lastIndependentDownloadAt,
    independentDownloadDue: !lastDownloadAt || now.getTime() - lastDownloadAt.getTime() >= MONTH_MS,
  }
}

export function describeLatestBackupStatus(record: BackupRecord | null, fileExists: boolean): string {
  if (!record) return 'Run the server backup command to create the first compressed snapshot.'
  if (!fileExists) return 'Manifest exists, but its latest file is missing.'
  const size = record.byteSize >= 1_024
    ? `${(record.byteSize / 1_024).toFixed(1)} KB`
    : `${record.byteSize} B`
  return `${size} · SHA-256 ${record.sha256.slice(0, 12)}…`
}
