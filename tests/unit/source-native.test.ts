import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { sourceWrite, withoutProviderSecrets } from '@/modules/source-native/contracts'
import { parseAndRenderDocument } from '@/modules/content/document'
import { nativeBootstrap, nativeMobileBootstrap } from '@/modules/source-native/bootstrap'
import { getOriginalTarotFaces } from '@/modules/source-native/tarot-faces'
import { getOriginalLetterArt } from '@/modules/source-native/letter-art'

describe('original UI persistence boundary', () => {
  it('extracts the original engraved letter artwork with only branding replacement', () => {
    const art = getOriginalLetterArt()
    expect(art.stamp).toContain('stampPerf')
    expect(art.stamp).toContain('KELEOZ')
    expect(art.seal).toContain('20.00')
  })
  it('retains both original Tarot face designs and all 78 unique faces', () => {
    const assets = getOriginalTarotFaces()
    expect(assets.faces).toHaveLength(78)
    expect(new Set(assets.faces.map(face => face.veil)).size).toBe(78)
    expect(assets.faces[11].veil).toContain('Justice')
    expect(assets.faces[11].veil).toContain('tsx-glyph')
    expect(assets.faces[11].orrery).toContain('tsx-orbit')
  })
  it('preserves original record fields but strips nested provider credentials', () => {
    expect(withoutProviderSecrets({ id: 'friend_1', nickname: 'QA', apiKey: 'secret', endpoint: 'https://private', config: { token: 'secret', memory: true } })).toEqual({ id: 'friend_1', nickname: 'QA', config: { memory: true } })
    expect(sourceWrite.safeParse({ op: 'put', store: 'memories', key: 'mem_1', value: { title: 'A', valence: 0.5 } }).success).toBe(true)
    expect(sourceWrite.safeParse({ op: 'clear', store: 'memories', key: 'all' }).success).toBe(false)
    expect(sourceWrite.safeParse({ op: 'put', store: 'sessions', key: 'admin', value: {} }).success).toBe(false)
  })

  it('renders original Markdown while retaining editable source text and sanitizing markup', () => {
    const text = '**原版正文**\n\n<script>alert(1)</script>'
    const rendered = parseAndRenderDocument({ type: 'doc', attrs: { sourceText: text, sourceFormat: 'md' }, content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })
    expect(rendered.html).toContain('<strong>原版正文</strong>')
    expect(rendered.html).not.toContain('<script>')
    expect(rendered.document.attrs?.sourceText).toBe(text)
    expect(rendered.plainText).toContain('原版正文')
  })

  it('loads data adapters before the original startup without rewriting source interaction functions', () => {
    const desktop = readFileSync('upstream/InternalBeyond-Desktop/InternalBeyond.html', 'utf8')
    const mobile = readFileSync('upstream/InternalBeyond-Mobile/index.html', 'utf8')
    expect(desktop.split('\ninit();')).toHaveLength(2)
    expect(mobile.split('(async function init(){')).toHaveLength(2)
    expect(mobile).toMatch(/  navTo\('profile'\);\r?\n  }catch\(e\)/)
    expect(() => new Function(nativeBootstrap)).not.toThrow()
    expect(() => new Function(nativeMobileBootstrap)).not.toThrow()
    for (const name of ['buildMemorySky=', 'edMd=', 'sendChatMessage=']) expect(nativeBootstrap).not.toContain(name)
  })
})
