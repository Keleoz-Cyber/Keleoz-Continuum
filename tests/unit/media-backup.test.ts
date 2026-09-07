import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { copyMediaSnapshot, restoreMediaSnapshot, hashFile, validateMediaBackupKey, removableBackupBundles } from '@/modules/operations/media-backup'

const roots: string[] = []
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'continuum-media-backup-test-'))
  roots.push(root)
  await mkdir(join(root, 'source'))
  await mkdir(join(root, 'bundle'))
  return root
}
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }) })

describe('local media backup boundary', () => {
  it('copies only required files with hashes and restores them into a newly created isolated directory', async () => {
    const root = await fixture()
    await mkdir(join(root, 'source', '2026'))
    await writeFile(join(root, 'source', '2026', 'image.webp'), 'image bytes')
    await writeFile(join(root, 'source', 'unreferenced.tmp'), 'unrelated')
    const snapshot = await copyMediaSnapshot(join(root, 'source'), join(root, 'bundle'), ['2026/image.webp', '2026/image.webp'])
    expect(snapshot.files).toEqual([{ key: '2026/image.webp', ...await hashFile(join(root, 'source', '2026', 'image.webp')) }])
    const restored = await restoreMediaSnapshot(join(root, 'bundle'), snapshot, root)
    expect(restored.directory).not.toBe(join(root, 'source'))
    expect(await readFile(join(restored.directory, '2026', 'image.webp'), 'utf8')).toBe('image bytes')
    expect(restored.fileCount).toBe(1)
  })
  it.each(['../outside', '/root', 'C:/outside', 'x\\outside', 'x//y', 'x/./y', 'x/../y', 'x:stream', 'x/CON', 'x./y'])('rejects unsafe portable key %s', (key) => {
    expect(() => validateMediaBackupKey(key)).toThrow('key')
  })
  it('fails on a required missing file rather than publishing a partial snapshot', async () => {
    const root = await fixture()
    await expect(copyMediaSnapshot(join(root, 'source'), join(root, 'bundle'), ['missing.webp'])).rejects.toThrow()
  })
  it('rejects linked directories before reading outside the source root', async () => {
    const root = await fixture()
    await mkdir(join(root, 'outside'))
    await writeFile(join(root, 'outside', 'private.webp'), 'private')
    await symlink(join(root, 'outside'), join(root, 'source', 'linked'), 'junction')
    await expect(copyMediaSnapshot(join(root, 'source'), join(root, 'bundle'), ['linked/private.webp'])).rejects.toThrow('symbolic')
  })
  it('rejects corruption during restore without writing into the live source', async () => {
    const root = await fixture()
    await writeFile(join(root, 'source', 'x.webp'), 'original')
    const snapshot = await copyMediaSnapshot(join(root, 'source'), join(root, 'bundle'), ['x.webp'])
    await writeFile(join(root, 'bundle', 'media', 'x.webp'), 'corrupt')
    await expect(restoreMediaSnapshot(join(root, 'bundle'), snapshot, root)).rejects.toThrow('integrity')
    expect(await readFile(join(root, 'source', 'x.webp'), 'utf8')).toBe('original')
  })
  it('keeps a shared bundle while weekly or monthly cadence still references its dump', () => {
    expect(removableBackupBundles(['bundles/abc/dump.dump', 'bundles/def/dump.dump'], ['bundles/abc/dump.dump'])).toEqual(['bundles/def'])
    expect(() => removableBackupBundles(['bundles/../dump.dump'], [])).toThrow()
  })
})
