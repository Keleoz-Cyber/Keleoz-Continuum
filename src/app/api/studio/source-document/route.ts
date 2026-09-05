import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getCurrentOwner } from '@/modules/auth/dal'
import { nativeBootstrap, nativeMobileBootstrap } from '@/modules/source-native/bootstrap'

export async function GET(request: Request) {
  if (!await getCurrentOwner()) return new Response('请先登录。', { status: 401 })
  if (new URL(request.url).searchParams.get('mobile') === '1') {
    const source = await readFile(path.resolve(process.cwd(), 'upstream/InternalBeyond-Mobile/index.html'), 'utf8')
    const start = '(async function init(){'
    if (!source.includes(start)) throw new Error('Original Mobile init boundary missing')
    const html = source.replace('<head>', '<head><base href="/reference/internal-beyond-mobile/">')
      .replace(start, nativeMobileBootstrap + '\n' + start + '\n await window.continuumStoreReady;')
      .replace(/  navTo\('profile'\);\r?\n  }catch\(e\)/, "  navTo('profile');\n  await window.__continuumShowMobile();\n  }catch(e)")
      .replace("navigator.serviceWorker.register('./ib-sw.js')", 'Promise.resolve()')
      .replace('</head>', '<style>#lockscr,#lk-preveil{display:none!important}.dw-item[data-page="icode"],.dw-item[data-page="diy"]{display:none!important}</style></head>')
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store', 'Content-Security-Policy': "connect-src 'self'; frame-ancestors 'self'; object-src 'none'", 'X-Content-Source': 'InternalBeyond-Mobile original runtime with Owner data adapter' } })
  }
  const original = await readFile(path.resolve(process.cwd(), 'upstream/InternalBeyond-Desktop/InternalBeyond.html'), 'utf8')
  if (!original.includes('\ninit();')) throw new Error('Original init boundary missing')
  const html = original.replace('<head>', '<head><base href="/reference/internal-beyond/">').replace('\ninit();', `\n${nativeBootstrap}`)
    .replace('</head>', `<style>#navbar,#fab-dock,#game-mini,#icode-mini,#guide-toc,#ib-guard-overlay{display:none!important}#splash{display:none!important}#app{opacity:1!important;visibility:visible!important}#api-key,#api-endpoint{pointer-events:none}#ws-open-btn,#cal-open-btn,#api-imagegen-group,#api-websearch-group,#api-ib-toggle{display:none!important}#page-api>.api-section:not(:has(#api-list-container)):not(#api-editor){display:none!important}#api-key{color:transparent!important}#api-key::placeholder{color:transparent!important}@media(max-width:900px){.rift-editor{width:calc(100vw - 20px);max-height:none;min-height:86vh}.rift-sidebar{width:180px;min-width:180px;padding:20px 14px}.rift-writing{padding:28px 20px}.rift-label{font-size:.78rem}.rift-select{font-size:.84rem}}@media(max-width:540px){.rift-editor{flex-direction:column}.rift-sidebar{width:100%;min-width:0;flex-direction:row;flex-wrap:wrap;gap:10px;padding:16px}.rift-sidebar>.rift-status,.rift-accent-line,.rift-date,.rift-stats,.rift-sidebar>.rift-label,.rift-imp-hint,.rift-sidebar>div[style]{display:none}.rift-sidebar>.rift-select{width:auto;max-width:45%;margin:0}.rift-writing{min-height:70vh;padding:24px}.rift-sidebar .btn{margin:0!important}.page{padding-left:10px;padding-right:10px}}</style></head>`)
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store', 'Content-Security-Policy': "connect-src 'self'; frame-ancestors 'self'; object-src 'none'", 'X-Content-Source': 'InternalBeyond-Desktop original runtime with Owner data adapter' } })
}
