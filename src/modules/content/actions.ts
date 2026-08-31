'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireOwner } from '@/modules/auth/dal'
import { contentRepository } from '@/modules/content/runtime'
import {
  contentPublicPath,
  draftSlugForType,
  parseContentType,
  studioContentPath,
} from '@/modules/content/routing'

const titleSchema = z.string().trim().min(1).max(240)
const entryIdSchema = z.uuid()

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
    exposure: 'full',
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
  updateTag(`content:${published.type}`)
  updateTag(`content:${published.type}:${published.slug}`)
  updateTag('content:timeline')
  revalidatePath(path)
  revalidatePath(published.type === 'page' ? '/about' : path.slice(0, path.lastIndexOf('/')) || path)
  if (projection) redirect(path)
  redirect(`${studioContentPath(entryId)}/preview`)
}
