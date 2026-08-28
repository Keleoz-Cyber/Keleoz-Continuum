import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { adaptDesktopSourceForPublicHome } from '@/modules/home/source-html-adapter'

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
  const requested = path.resolve(sourceRoot, ...segments)
  const relative = path.relative(sourceRoot, requested)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Not found', { status: 404 })
  try {
    const data = await readFile(requested)
    const adaptHome = path.basename(requested) === 'InternalBeyond.html'
      && new URL(request.url).searchParams.get('continuum-gloss') === '2'
    const body = adaptHome ? adaptDesktopSourceForPublicHome(data.toString('utf8')) : new Uint8Array(data)
    return new Response(body, {
      headers: {
        'content-type': types[path.extname(requested).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': adaptHome ? 'no-cache' : 'public, max-age=31536000, immutable',
        'x-content-source': 'InternalBeyond-Desktop immutable snapshot',
        ...(adaptHome ? { 'x-content-adapter': 'Continuum source gloss fallback v2' } : {}),
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
