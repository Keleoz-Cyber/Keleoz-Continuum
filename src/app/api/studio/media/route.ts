import { MediaValidationError } from '@/modules/media/contracts'
import { mediaService } from '@/modules/media/runtime'
import { requireOwner } from '@/modules/auth/dal'

const MAX_FORM_BYTES = 11 * 1024 * 1024

export async function POST(request: Request) {
  await requireOwner()
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FORM_BYTES) {
    return Response.json({ error: 'Upload must be 10 MB or smaller.' }, { status: 413 })
  }
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return Response.json({ error: 'Choose an image file.' }, { status: 400 })
    const uploaded = await mediaService.uploadImage({
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
