import { z } from 'zod'
import { getCurrentOwner } from '@/modules/auth/dal'
import { parseAndRenderDocument } from '@/modules/content/document'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { serverEnv } from '@/shared/env'
export async function POST(request:Request){
  if(!await getCurrentOwner())return Response.json({error:'unauthorized'},{status:401})
  if(!hasAllowedOrigin(request,serverEnv.SITE_ORIGIN))return Response.json({error:'invalid_origin'},{status:403})
  if(Number(request.headers.get('content-length'))>2_000_000)return Response.json({error:'too_large'},{status:413})
  const parsed=z.object({text:z.string().max(500_000),format:z.enum(['txt','md'])}).safeParse(await request.json().catch(()=>null))
  if(!parsed.success)return Response.json({error:'invalid_document'},{status:400})
  const {html}=parseAndRenderDocument({type:'doc',attrs:{sourceText:parsed.data.text,sourceFormat:parsed.data.format},content:[]})
  return Response.json({html},{headers:{'Cache-Control':'private, no-store'}})
}
