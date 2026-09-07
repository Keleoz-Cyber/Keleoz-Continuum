import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPublicSiteConfig } from '@/modules/site-config/runtime'
import { serverEnv } from '@/shared/env'
import { localizeSourceFonts } from '@/modules/source-native/fonts'

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
  const asset=segments.join('/')
  if(asset==='tarot_bg.png'||asset===`portraits/portrait_[${serverEnv.AI_COMPANION_NAME}].png`){
    const {appearance}=await getPublicSiteConfig(),url=appearance.desktop[asset==='tarot_bg.png'?'tarot':'portrait']
    if(url)return new Response(null,{status:307,headers:{location:url,'cache-control':'no-cache'}})
  }

  try {
    const data = await readFile(requested)
    const extension = path.extname(requested).toLowerCase()
    const adapted = asset === 'game_module.js'
    return new Response(adapted ? localizeSourceFonts(data.toString('utf8')) : new Uint8Array(data), {
      headers: {
        'content-type': contentTypes[extension] ?? 'application/octet-stream',
        'cache-control': adapted ? 'no-cache' : 'public, max-age=31536000, immutable',
        'x-content-source': 'InternalBeyond-Desktop immutable snapshot',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
