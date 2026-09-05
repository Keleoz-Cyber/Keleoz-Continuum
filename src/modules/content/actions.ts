'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { verifyPassword } from '@/modules/auth/crypto'
import { requireOwner } from '@/modules/auth/dal'
import { authRepository } from '@/modules/auth/runtime'
import { contentRepository } from '@/modules/content/runtime'
import {
  contentPublicPath,
  draftSlugForType,
  parseContentType,
  studioContentPath,
} from '@/modules/content/routing'

const titleSchema = z.string().trim().min(1).max(240)
const entryIdSchema = z.uuid()
const revisionSchema = z.coerce.number().int().positive()
const passwordSchema = z.string().min(1).max(256)

export type DeleteContentState = { error: string | null }

function invalidateContentProjection(type: 'blog' | 'project' | 'moment' | 'page', slug: string) {
  const path = contentPublicPath(type, slug)
  updateTag(`content:${type}`)
  updateTag(`content:${type}:${slug}`)
  updateTag('content:timeline')
  revalidatePath(path)
  revalidatePath(type === 'page' ? '/about' : path.slice(0, path.lastIndexOf('/')) || path)
  revalidatePath('/')
  revalidatePath('/studio', 'layout')
}

export async function createBlogDraftAction(formData: FormData): Promise<never> {
  formData.set('type', 'blog')
  return createContentDraftAction(formData)
}

export async function createContentDraftAction(formData: FormData): Promise<never> {
  await requireOwner()
  const type = parseContentType(formData.get('type'))
  const title = titleSchema.parse(formData.get('title'))
  const slug = draftSlugForType(type, title, randomUUID().slice(0, 8))
  const draft = await contentRepository.createDraft({
    type,
    slug,
    title,
    subtitle: null,
    categoryLabel: null,
    summary: '',
    exposure: 'hidden',
    document: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { blockId: randomUUID() },
        },
      ],
    },
  })

  redirect(studioContentPath(draft.id))
}

export async function publishBlogAction(formData: FormData): Promise<never> {
  return publishContentAction(formData)
}

export async function publishContentAction(formData: FormData): Promise<never> {
  await requireOwner()
  const entryId = entryIdSchema.parse(formData.get('entryId'))
  const published = await contentRepository.publishDraft({ entryId })
  const projection = published.projection
  const path = contentPublicPath(published.type, published.slug)
  invalidateContentProjection(published.type, published.slug)
  if (projection) redirect(path)
  redirect(`${studioContentPath(entryId)}/preview`)
}

export async function restoreContentVersionAction(formData: FormData): Promise<never> {
  await requireOwner()
  const entryId = entryIdSchema.parse(formData.get('entryId'))
  const versionId = entryIdSchema.parse(formData.get('versionId'))
  const expectedRevision = revisionSchema.parse(formData.get('expectedRevision'))
  await contentRepository.restoreVersionToDraft({ entryId, versionId, expectedRevision })
  revalidatePath(studioContentPath(entryId))
  redirect(studioContentPath(entryId))
}

export async function archiveContentAction(formData: FormData): Promise<never> {
  await requireOwner()
  const entryId = entryIdSchema.parse(formData.get('entryId'))
  const archived = await contentRepository.archiveContent({ entryId })
  invalidateContentProjection(archived.type, archived.slug)
  redirect('/studio?content=archived')
}

export async function restoreArchivedContentAction(formData: FormData): Promise<never> {
  await requireOwner()
  const entryId = entryIdSchema.parse(formData.get('entryId'))
  await contentRepository.restoreArchivedContent({ entryId })
  revalidatePath('/studio')
  redirect('/studio?content=restored')
}

export async function deleteArchivedContentAction(
  _previousState: DeleteContentState,
  formData: FormData,
): Promise<DeleteContentState> {
  const owner = await requireOwner()
  const entryId = entryIdSchema.parse(formData.get('entryId'))
  const password = passwordSchema.parse(formData.get('password'))
  const storedOwner = await authRepository.findOwnerByUsername(owner.username)
  if (!storedOwner || !(await verifyPassword(storedOwner.passwordHash, password))) {
    return { error: 'Owner 密码不正确，内容未删除。' }
  }
  const deleted = await contentRepository.deleteArchivedContent({ entryId })
  invalidateContentProjection(deleted.type, deleted.slug)
  redirect('/studio?content=deleted')
}
