'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireOwner } from '@/modules/auth/dal'
import { contentRepository } from '@/modules/content/runtime'
import { normalizeSlug } from '@/modules/content/slug'

const titleSchema = z.string().trim().min(1).max(240)
const entryIdSchema = z.uuid()

export async function createBlogDraftAction(formData: FormData): Promise<never> {
  await requireOwner()
  const title = titleSchema.parse(formData.get('title'))
  const slug = `${normalizeSlug(title)}-${randomUUID().slice(0, 8)}`
  const draft = await contentRepository.createDraft({
    type: 'blog',
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

  redirect(`/studio/blog/${draft.id}`)
}

export async function publishBlogAction(formData: FormData): Promise<never> {
  await requireOwner()
  const entryId = entryIdSchema.parse(formData.get('entryId'))
  const published = await contentRepository.publishDraft({ entryId })
  const projection = published.projection
  revalidatePath('/blog')
  if (projection) revalidatePath(`/blog/${projection.slug}`)
  redirect(projection ? `/blog/${projection.slug}` : `/studio/blog/${entryId}/preview`)
}
