import { readFileSync } from 'node:fs'
import { brotliDecompressSync, gunzipSync } from 'node:zlib'
import { expect, it } from 'vitest'
import { homeCanvasUrl, prioritizeHomeCanvas } from '@/modules/home/delivery'

it('keeps original PNG bytes and the original font CSS', () => {
  const source = readFileSync('upstream/InternalBeyond-Desktop/bg-canvas.png')
  expect(homeCanvasUrl).toBe('/reference/internal-beyond/bg-canvas.png')
  expect(readFileSync('public' + homeCanvasUrl).equals(source)).toBe(true)
  expect(brotliDecompressSync(readFileSync('public/fonts/source.css.br')).equals(readFileSync('public/fonts/source.css'))).toBe(true)
  expect(gunzipSync(readFileSync('public/fonts/source.css.gz')).equals(readFileSync('public/fonts/source.css'))).toBe(true)
})

it('prioritizes the chosen canvas without replacing an Owner published background', () => {
  const html = '<head></head><script>probe(["bg-canvas.jpg","bg-canvas.png"])</script>'
  const adapted = prioritizeHomeCanvas(html)
  expect(adapted).toContain('fetchpriority="high"')
  expect(adapted).not.toContain('bg-canvas.jpg')
  expect(adapted).toContain(homeCanvasUrl)
  expect(adapted).toContain(`probe(["${homeCanvasUrl}","${homeCanvasUrl}"])`)
  const custom = prioritizeHomeCanvas(html, '/media/owner/large.webp')
  expect(custom).not.toContain(homeCanvasUrl)
  expect(custom.match(/\/media\/owner\/large.webp/g)).toHaveLength(3)
})
