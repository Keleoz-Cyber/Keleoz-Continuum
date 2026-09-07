// Refresh only on purpose; builds and browsers never contact Google Fonts.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'

const root = process.cwd()
const output = path.join(root, 'public/fonts')
const sources = ['upstream/InternalBeyond-Desktop/InternalBeyond.html', 'upstream/InternalBeyond-Mobile/index.html', 'upstream/InternalBeyond-Desktop/game/game_module.js']
const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function download(url, host, limit) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.hostname !== host || parsed.username || parsed.password) throw new Error('Unexpected font origin')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': agent }, redirect: 'error', signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`Download ${response.status}: ${url}`)
      const parts = []; let size = 0
      for await (const chunk of response.body) {
        size += chunk.length
        if (size > limit) throw new Error('Font download exceeds limit')
        parts.push(chunk)
      }
      return Buffer.concat(parts)
    } catch (error) { if (attempt === 2) throw error }
  }
}
await mkdir(output, { recursive: true })
const urls = new Set()
for (const source of sources) {
  for (const match of (await readFile(path.join(root, source), 'utf8')).matchAll(/https:\/\/fonts\.googleapis\.com\/css[^'"\s)<>]+/g)) urls.add(match[0].replaceAll('&amp;', '&'))
}
const stylesheets = []
const assets = new Map()
const families = new Set()
for (const url of urls) {
  const css = (await download(url, 'fonts.googleapis.com', 2 * 1024 * 1024)).toString('utf8')
  for (const match of css.matchAll(/font-family:\s*'([^']+)'/g)) families.add(match[1])
  for (const match of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) assets.set(match[1], null)
  stylesheets.push({ url, css })
}
let total = 0
const pending = [...assets.keys()]
await Promise.all(Array.from({ length: 4 }, async () => {
  while (pending.length) {
    const url = pending.shift()
    const bytes = await download(url, 'fonts.gstatic.com', 20 * 1024 * 1024)
    if (bytes.subarray(0, 4).toString() !== 'wOF2') throw new Error('Expected WOFF2 font')
    total += bytes.length
    if (total > 100 * 1024 * 1024) throw new Error('Total font budget exceeded')
    const sha256 = hash(bytes), file = `${sha256}.woff2`
    await writeFile(path.join(output, file), bytes)
    assets.set(url, { file, sha256, byteSize: bytes.length })
  }
}))
const licenses = []
for (const family of [...families].sort()) {
  const slug = family.toLowerCase().replaceAll(' ', '')
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${slug}/OFL.txt`
  const bytes = await download(url, 'raw.githubusercontent.com', 200000)
  if (!bytes.toString().includes('SIL OPEN FONT LICENSE')) throw new Error(`Missing license: ${family}`)
  const file = `${slug}-OFL.txt`
  await writeFile(path.join(output, file), bytes)
  licenses.push({ family, url, file, sha256: hash(bytes) })
}
// Remove duplicate declarations, but retain the original unicode ranges, styles and weights.
const blocks = new Set()
for (const { css } of stylesheets) {
  const local = css.replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g, (_, url) => `url('/fonts/${assets.get(url).file}')`)
  for (const match of local.matchAll(/@font-face\s*\{[^}]+\}/g)) blocks.add(match[0])
}
const css = `/* Source typography, self-hosted. See manifest.json and *-OFL.txt. */\n${[...blocks].join('\n')}\n`
const manifest = { schemaVersion: 1, sources, stylesheets: [...urls], families: [...families].sort(), licenses, assets: [...assets].map(([url, entry]) => ({ url, ...entry })), cssSha256: hash(css), totalBytes: total }
await writeFile(path.join(output, 'source.css.tmp'), css)
await writeFile(path.join(output, 'manifest.json.tmp'), JSON.stringify(manifest, null, 2) + '\n')
await rename(path.join(output, 'source.css.tmp'), path.join(output, 'source.css'))
await rename(path.join(output, 'manifest.json.tmp'), path.join(output, 'manifest.json'))
await writeFile(path.join(output, 'source.css.br'), brotliCompressSync(Buffer.from(css)))
await writeFile(path.join(output, 'source.css.gz'), gzipSync(Buffer.from(css), { level: 9 }))
console.log(JSON.stringify({ families: manifest.families, files: assets.size, totalBytes: total, cssBytes: Buffer.byteLength(css) }))
