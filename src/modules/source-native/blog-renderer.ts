import { readFileSync } from 'node:fs'
import path from 'node:path'

type Renderer = (src: string, markdown: boolean) => Array<{ html: string }>
let renderer: Renderer | undefined

// Execute only the pinned upstream's pure text renderer, with input as arguments.
export function renderOriginalBlog(content: string, format: 'txt' | 'md') {
  if (!renderer) {
    const source = readFileSync(path.resolve(process.cwd(), 'upstream/InternalBeyond-Desktop/InternalBeyond.html'), 'utf8')
    const start = source.indexOf('function _blogEscAttr(')
    const end = source.indexOf('/* 分批渲染：', start)
    if (start < 0 || end < start) throw new Error('Original Blog renderer boundary missing')
    renderer = new Function('src', 'isMd', `function esc(t){return String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}\n${source.slice(start, end)}\nreturn _blogBlocks(src,isMd);`) as Renderer
  }
  return renderer!(content, format === 'md').map((block) => format === 'txt' ? `<p>${block.html.replaceAll('\n', '<br>')}</p>` : block.html).join('')
}
