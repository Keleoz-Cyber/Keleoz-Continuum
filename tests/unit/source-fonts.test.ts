import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { localizeSourceFonts } from '@/modules/source-native/fonts'

describe('source typography local delivery', () => {
  for (const source of ['upstream/InternalBeyond-Desktop/InternalBeyond.html', 'upstream/InternalBeyond-Mobile/index.html', 'upstream/InternalBeyond-Desktop/game/game_module.js']) {
    it(`localizes ${source} without changing typography rules`, () => {
      const original = readFileSync(source, 'utf8'), html = localizeSourceFonts(original)
      expect(html).not.toMatch(/https:\/\/fonts\.(googleapis|gstatic)\.com/)
      expect(html).toContain("@import url('/fonts/source.css')")
      expect(localizeSourceFonts(html)).toBe(html)
      expect(html.match(/font-family:[^;}]+/g)).toEqual(original.match(/font-family:[^;}]+/g))
    })
  }
  it('ships verified fonts, unicode subsets, original weights and licenses', () => {
    const manifest = JSON.parse(readFileSync('public/fonts/manifest.json', 'utf8'))
    const css = readFileSync('public/fonts/source.css', 'utf8')
    expect(createHash('sha256').update(css).digest('hex')).toBe(manifest.cssSha256)
    expect(manifest.families).toEqual(['Cormorant Garamond', 'Great Vibes', 'IBM Plex Mono', 'Noto Sans SC', 'Noto Serif SC', 'Pinyon Script', 'Raleway', 'Spectral'])
    expect(css).not.toContain('https:')
    expect(css).toContain('unicode-range:')
    for (const { file, sha256, byteSize } of manifest.assets) {
      const bytes = readFileSync('public/fonts/' + file)
      expect(bytes.length).toBe(byteSize)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha256)
      expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
    }
    for (const { file, sha256 } of manifest.licenses) {
      const bytes = readFileSync('public/fonts/' + file)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha256)
      expect(bytes.toString()).toContain('SIL OPEN FONT LICENSE')
    }
  })
})
