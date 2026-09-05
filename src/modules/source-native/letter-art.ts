import { readFileSync } from 'node:fs'
import path from 'node:path'

let art: { stamp: string; seal: string } | undefined
export function getOriginalLetterArt() {
  if (art) return art
  const source = readFileSync(path.resolve(process.cwd(), 'upstream/InternalBeyond-Desktop/InternalBeyond.html'), 'utf8')
  const extract = (name: string): string => {
    const start = source.indexOf(`var ${name}=`)
    const end = source.indexOf('\n', start)
    if (start < 0 || end < start) throw new Error('Original letter art boundary missing')
    return new Function(`${source.slice(start, end)}\nreturn ${name};`)() as string
  }
  art = { stamp: extract('_letterStampSVG').replaceAll('INTERNAL', 'KELEOZ').replaceAll('INFERNAL', 'KELEOZ').replaceAll('BEYOND', 'CONTINUUM'), seal: extract('_sealEmblemSVG') }
  return art
}
