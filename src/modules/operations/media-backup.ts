import { createHash } from 'node:crypto'
import { constants, createWriteStream } from 'node:fs'
import { lstat, mkdir, mkdtemp, open, rm } from 'node:fs/promises'
import { dirname, join, parse, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { Transform, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { z } from 'zod'

export const mediaSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  files: z.array(z.object({
    key: z.string().max(512), byteSize: z.number().int().nonnegative(), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })).max(100_000),
})
export type MediaSnapshot = z.infer<typeof mediaSnapshotSchema>

export function validateMediaBackupKey(key: string): string {
  if (key.length > 512 || !/^[a-z0-9][a-z0-9/._-]*$/.test(key) || key.split('/').some((part) =>
    !part || part === '.' || part === '..' || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part))) {
    throw new Error('Invalid media backup key')
  }
  return key
}

// Check every existing component, including configured roots, on both reads and writes.
export async function assertNoSymlinkPath(path: string): Promise<void> {
  const absolute = resolve(path)
  let current = parse(absolute).root
  for (const part of relative(current, absolute).split(/[\\/]/).filter(Boolean)) {
    current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error('Backup path contains a symbolic link')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      throw error
    }
  }
}

async function streamFile(source: string, target?: string) {
  await assertNoSymlinkPath(source)
  const handle = await open(source, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const before = await handle.stat()
    if (!before.isFile()) throw new Error('Backup source is not a regular file')
    const hash = createHash('sha256')
    let byteSize = 0
    const meter = new Transform({ transform(chunk, _encoding, callback) {
      byteSize += chunk.length
      hash.update(chunk)
      callback(null, chunk)
    } })
    if (target) {
      await assertNoSymlinkPath(target)
      await mkdir(dirname(target), { recursive: true, mode: 0o700 })
      await assertNoSymlinkPath(target)
    }
    await pipeline(handle.createReadStream({ autoClose: false }), meter,
      target ? createWriteStream(target, { flags: 'wx', mode: 0o600 }) : new Writable({ write(_chunk, _encoding, callback) { callback() } }))
    await assertNoSymlinkPath(source)
    const after = await lstat(source)
    if (!after.isFile() || before.dev !== after.dev || before.ino !== after.ino || before.size !== byteSize ||
      after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) {
      throw new Error('Backup source changed or disappeared while being copied')
    }
    return { byteSize, sha256: hash.digest('hex') }
  } finally {
    await handle.close()
  }
}

export async function hashFile(path: string) { return streamFile(path) }

export async function copyMediaSnapshot(sourceRoot: string, bundleRoot: string, keys: string[]): Promise<MediaSnapshot> {
  if (keys.length > 100_000) throw new Error('Media backup exceeds 100000 file inventory limit')
  const unique = [...new Set(keys.map(validateMediaBackupKey))].sort()
  await assertNoSymlinkPath(sourceRoot)
  await assertNoSymlinkPath(bundleRoot)
  const files: MediaSnapshot['files'] = []
  for (const key of unique) {
    const details = await streamFile(join(sourceRoot, key), join(bundleRoot, 'media', key))
    files.push({ key, ...details })
  }
  return { schemaVersion: 1, files }
}

export async function restoreMediaSnapshot(bundleRoot: string, input: MediaSnapshot, temporaryRoot = tmpdir()) {
  const snapshot = mediaSnapshotSchema.parse(input)
  const keys = snapshot.files.map((file) => validateMediaBackupKey(file.key))
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate media backup key')
  await assertNoSymlinkPath(temporaryRoot)
  const directory = await mkdtemp(join(temporaryRoot, 'continuum-media-restore-'))
  try {
    for (const file of snapshot.files) {
      const actual = await streamFile(join(bundleRoot, 'media', file.key), join(directory, file.key))
      if (actual.sha256 !== file.sha256 || actual.byteSize !== file.byteSize) throw new Error('Media backup integrity check failed')
    }
    return { directory, fileCount: snapshot.files.length }
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}

export function removableBackupBundles(removedFiles: string[], retainedFiles: string[]): string[] {
  function bundle(file: string) {
    if (!file.startsWith('bundles/')) return null // Legacy cadence files remain independent.
    if (!/^bundles\/[a-zA-Z0-9_-]+\/dump\.dump$/.test(file)) throw new Error('Invalid backup bundle path')
    return file.slice(0, file.lastIndexOf('/'))
  }
  const keep = new Set(retainedFiles.map(bundle))
  return [...new Set(removedFiles.map(bundle).filter((path): path is string => path !== null && !keep.has(path)))]
}
