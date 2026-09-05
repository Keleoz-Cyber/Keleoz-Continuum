import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getCurrentOwner } from '@/modules/auth/dal'
import { originalEditorDocument } from '@/modules/source-native/editor-document'
export async function GET(request:Request) {
  if(!await getCurrentOwner())return new Response('请先登录。',{status:401})
  const mobile=new URL(request.url).searchParams.get('mobile')==='1'
  const file=mobile?'upstream/InternalBeyond-Mobile/index.html':'upstream/InternalBeyond-Desktop/InternalBeyond.html'
  return new Response(originalEditorDocument(await readFile(path.resolve(file),'utf8'),mobile),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Content-Security-Policy':"script-src 'none'; connect-src 'self'; frame-ancestors 'self'; object-src 'none'"}})
}
