import { readFile } from 'node:fs/promises'
import path from 'node:path'

const sourceRoot = path.resolve(process.cwd(), 'upstream', 'InternalBeyond-Desktop', 'game')
const contentTypes: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const requested = path.resolve(sourceRoot, ...segments)
  const relative = path.relative(sourceRoot, requested)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Not found', { status: 404 })

  try {
    const data = await readFile(requested)
    const extension = path.extname(requested).toLowerCase()
    return new Response(new Uint8Array(data), {
      headers: {
        'content-type': contentTypes[extension] ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-source': 'InternalBeyond-Desktop immutable snapshot',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
