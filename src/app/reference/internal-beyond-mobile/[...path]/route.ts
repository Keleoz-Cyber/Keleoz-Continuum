import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { localizeSourceFonts } from '@/modules/source-native/fonts'
import { delegateSourceLoading } from '@/modules/home/loading-feedback'
import { publicSourceResponse } from '@/modules/home/response-cache'

const sourceRoot = path.resolve(process.cwd(), 'upstream', 'InternalBeyond-Mobile')
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
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const requested = path.resolve(sourceRoot, ...segments)
  const relative = path.relative(sourceRoot, requested)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Not found', { status: 404 })
  try {
    const data = await readFile(requested)
    const adapted = relative === 'index.html' && new URL(request.url).searchParams.get('continuum-local') === '1'
    // This shell contains no request/user/site configuration; published config is applied by the parent.
    return publicSourceResponse(adapted ? delegateSourceLoading(localizeSourceFonts(data.toString('utf8')), true) : new Uint8Array(data), request, {
        'content-type': types[path.extname(requested).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': adapted ? 'public, max-age=0, s-maxage=300, must-revalidate' : 'public, max-age=31536000, immutable',
        'x-content-source': 'InternalBeyond-Mobile immutable snapshot',
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
