import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { adaptDesktopSourceForPublicHome } from '@/modules/home/source-html-adapter'
import { getPublicSiteConfig } from '@/modules/site-config/runtime'
import { localizeSourceFonts } from '@/modules/source-native/fonts'
import { prioritizeHomeCanvas } from '@/modules/home/delivery'
import { publicSourceResponse } from '@/modules/home/response-cache'

const sourceRoot = path.resolve(process.cwd(), 'upstream', 'InternalBeyond-Desktop')
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  if (segments.length === 1 && segments[0] === 'bg-canvas.jpg') {
    return new Response(null, {
      status: 307,
      headers: {
        location: '/reference/internal-beyond/bg-canvas.png',
        'cache-control': 'no-cache',
        'x-content-adapter': 'Continuum optional source asset compatibility',
      },
    })
  }
  if (segments.length === 1 && segments[0] === 'signs.js') {
    return new Response('', {
      headers: {
        'content-type': 'text/javascript; charset=utf-8',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-adapter': 'Continuum optional source asset compatibility',
      },
    })
  }
  const requested = path.resolve(sourceRoot, ...segments)
  const relative = path.relative(sourceRoot, requested)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Not found', { status: 404 })
  try {
    const data = await readFile(requested)
    const adaptHome = path.basename(requested) === 'InternalBeyond.html'
      && new URL(request.url).searchParams.get('continuum-gloss') === '2'
    const adaptGame = segments.join('/') === 'game/game_module.js' && new URL(request.url).searchParams.get('continuum-local') === '1'
    let body = adaptHome ? adaptDesktopSourceForPublicHome(data.toString('utf8')) : new Uint8Array(data)
    if(adaptGame)body=localizeSourceFonts(data.toString('utf8'))
    if(adaptHome&&typeof body==='string'){
      const {appearance}=await getPublicSiteConfig()
      for(const [key,file] of [['internal','bg-internal.jpg'],['infernal','bg-infernal.jpg']])if(appearance.desktop[key])body=body.replaceAll(file,appearance.desktop[key])
      body=prioritizeHomeCanvas(body,appearance.desktop.canvas || undefined)
    }
    return publicSourceResponse(body, request, {
        'content-type': types[path.extname(requested).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': adaptHome || adaptGame ? 'no-cache' : 'public, max-age=31536000, immutable',
        'x-content-source': 'InternalBeyond-Desktop immutable snapshot',
        ...(adaptHome ? { 'x-content-adapter': 'Continuum source gloss fallback v2' } : {}),
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
