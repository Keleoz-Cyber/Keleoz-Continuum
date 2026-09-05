import { readFileSync } from 'node:fs'
import path from 'node:path'

let assets: { faces: { veil: string; orrery: string }[]; css: string } | undefined
export function getOriginalTarotFaces() {
  if (assets) return assets
  const source = readFileSync(path.resolve(process.cwd(), 'upstream/InternalBeyond-Desktop/game/game_module.js'), 'utf8')
  const start = source.indexOf('const MAJOR_ARCANA =')
  const end = source.indexOf('/* ── TAROT SPREADS', start)
  const cssStart = source.indexOf('.tarot-slot-card{')
  const cssEnd = source.indexOf('/* Flying card animation */', cssStart)
  if ([start, end, cssStart, cssEnd].some(index => index < 0)) throw new Error('Original Tarot face boundary missing')
  const render = new Function('localStorage', `${source.slice(start, end)}\nreturn TAROT_DECK.map(card=>{TAROT_FACE_STYLE='veil';const veil=buildTarotFaceHTML(card,false);TAROT_FACE_STYLE='orrery';return {veil,orrery:buildTarotFaceHTML(card,false)}});`)
  assets = { faces: render({ getItem: () => null }), css: source.slice(cssStart, cssEnd) }
  return assets
}
