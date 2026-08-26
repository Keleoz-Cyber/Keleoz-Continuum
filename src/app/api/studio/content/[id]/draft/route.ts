import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentOwner } from '@/modules/auth/dal'
import {
  ContentNotFoundError,
  DraftConflictError,
} from '@/modules/content/repository'
import { contentRepository } from '@/modules/content/runtime'
import { draftSnapshotSchema } from '@/modules/content/schemas'
import { serverEnv } from '@/shared/env'
import { hasAllowedOrigin } from '@/shared/same-origin'

const requestSchema = z.object({
  expectedRevision: z.int().positive(),
  snapshot: draftSnapshotSchema,
})

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentOwner())) {
    return NextResponse.json({ code: 'unauthorized' }, { status: 401 })
  }
  if (!hasAllowedOrigin(request, serverEnv.SITE_ORIGIN)) {
    return NextResponse.json({ code: 'invalid_origin' }, { status: 403 })
  }

  const { id } = await context.params
  const entryId = z.uuid().safeParse(id)
  const body = requestSchema.safeParse(await request.json().catch(() => null))
  if (!entryId.success || !body.success) {
    return NextResponse.json({ code: 'invalid_request' }, { status: 400 })
  }

  try {
    const saved = await contentRepository.saveDraft({
      entryId: entryId.data,
      expectedRevision: body.data.expectedRevision,
      snapshot: body.data.snapshot,
    })
    return NextResponse.json({ revision: saved.revision, savedAt: saved.savedAt.toISOString() })
  } catch (error) {
    if (error instanceof DraftConflictError) {
      return NextResponse.json(
        { code: 'draft_conflict', currentRevision: error.currentRevision },
        { status: 409 },
      )
    }
    if (error instanceof ContentNotFoundError) {
      return NextResponse.json({ code: 'not_found' }, { status: 404 })
    }
    throw error
  }
}
