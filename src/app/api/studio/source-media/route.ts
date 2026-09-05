import { getCurrentOwner } from '@/modules/auth/dal'
import { mediaService } from '@/modules/media/runtime'
export async function GET() {
  if (!await getCurrentOwner()) return Response.json({error:'unauthorized'},{status:401})
  const media=await mediaService.listReady()
  return Response.json(media.map(({id,kind,originalName,altText})=>({id,kind,originalName,altText})),{headers:{'Cache-Control':'private, no-store'}})
}
