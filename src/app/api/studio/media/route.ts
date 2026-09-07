import { MediaValidationError } from '@/modules/media/contracts'
import { mediaService } from '@/modules/media/runtime'
import { requireOwner } from '@/modules/auth/dal'
import { z } from 'zod'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { serverEnv } from '@/shared/env'

const MAX_FORM_BYTES = 26 * 1024 * 1024

export async function POST(request: Request) {
  await requireOwner()
  if(!hasAllowedOrigin(request,serverEnv.SITE_ORIGIN))return Response.json({error:'Invalid request origin.'},{status:403})
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FORM_BYTES) {
    return Response.json({ error: 'Upload exceeds the V1 media size limit.' }, { status: 413 })
  }
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return Response.json({ error: 'Choose an image file.' }, { status: 400 })
    const uploaded = await mediaService.uploadFile({
      bytes: Buffer.from(await file.arrayBuffer()),
      originalName: file.name,
      declaredMimeType: file.type,
      altText: String(formData.get('altText') ?? ''),
    })
    return Response.json({ id: uploaded.id, state: uploaded.state }, { status: 201 })
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    return Response.json({ error: 'Media upload failed.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  await requireOwner()
  if(!hasAllowedOrigin(request,serverEnv.SITE_ORIGIN))return Response.json({error:'Invalid request origin.'},{status:403})
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get('id'))
  if (!id.success) return Response.json({ error: 'Invalid media id.' }, { status: 400 })
  try {
    await mediaService.deleteMedia(id.data)
    return new Response(null, { status: 204 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Media delete failed.' }, { status: 409 })
  }
}
