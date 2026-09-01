'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireOwner } from '@/modules/auth/dal'
import { personaAiEnabled, personaGenerationService, personaRepository } from '@/modules/persona/runtime'

const idSchema = z.uuid()
const actionSchema = z.enum(['post', 'comment', 'reply', 'repost'])
const decisionSchema = z.enum(['approved', 'rejected', 'deleted'])
const text = (value: FormDataEntryValue | null) => String(value ?? '')
const checked = (formData: FormData, name: string) => formData.get(name) === 'on'

function personaForm(formData: FormData) {
  return {
    name: text(formData.get('name')),
    handle: text(formData.get('handle')).replace(/^@/, ''),
    description: text(formData.get('description')),
    systemPrompt: text(formData.get('systemPrompt')),
    enabled: checked(formData, 'enabled'),
    canPost: checked(formData, 'canPost'),
    canComment: checked(formData, 'canComment'),
    canRepost: checked(formData, 'canRepost'),
    canUseImages: checked(formData, 'canUseImages'),
  }
}

export async function createPersonaAction(formData: FormData): Promise<never> {
  await requireOwner()
  await personaRepository.createPersona(personaForm(formData))
  redirect('/studio?persona=created')
}

export async function updatePersonaAction(formData: FormData): Promise<never> {
  await requireOwner()
  await personaRepository.updatePersona({ id: idSchema.parse(formData.get('id')), ...personaForm(formData) })
  redirect('/studio?persona=updated')
}

export async function generatePersonaReviewAction(formData: FormData): Promise<never> {
  const owner = await requireOwner()
  if (!personaAiEnabled) redirect('/studio?persona=ai-disabled')
  const action = actionSchema.parse(formData.get('action'))
  let targetEntryId: string | null = null
  let targetCommentId: string | null = null
  if (action === 'comment' || action === 'repost') {
    targetEntryId = idSchema.parse(formData.get('targetEntryId'))
  } else if (action === 'reply') {
    const [entry, comment] = text(formData.get('replyTarget')).split(':')
    targetEntryId = idSchema.parse(entry)
    targetCommentId = idSchema.parse(comment)
  }
  const moments = await personaRepository.listPublicMoments()
  const target = targetEntryId ? moments.find((moment) => moment.entryId === targetEntryId) : null
  if (targetEntryId && !target) redirect('/studio?persona=target-missing')
  const reply = targetCommentId ? target?.comments.find((comment) => comment.id === targetCommentId) : null
  if (targetCommentId && !reply) redirect('/studio?persona=target-missing')
  const targetContext = target
    ? [`作者：${target.author.name}`, `正文：${target.summary}`, reply ? `被回复评论：${reply.author.name}：${reply.content}` : ''].filter(Boolean).join('\n')
    : null
  let notice = 'queued'
  try {
    await personaGenerationService.generate({
      personaId: idSchema.parse(formData.get('personaId')),
      ownerId: owner.id,
      action,
      targetEntryId,
      targetCommentId,
      targetContext,
      now: new Date(),
    })
  } catch {
    notice = 'generation-failed'
  }
  redirect(`/studio?persona=${notice}`)
}

export async function moderatePersonaReviewAction(formData: FormData): Promise<never> {
  await requireOwner()
  const result = await personaRepository.moderateReview({
    reviewId: idSchema.parse(formData.get('reviewId')),
    decision: decisionSchema.parse(formData.get('decision')),
    editedContent: text(formData.get('editedContent')),
    mediaObjectId: text(formData.get('mediaObjectId')) || null,
  })
  updateTag('moments:social')
  if (result.status === 'approved') {
    updateTag('content:moment')
    if (result.publishedSlug) {
      updateTag(`content:moment:${result.publishedSlug}`)
      updateTag('content:timeline')
    }
    revalidatePath('/moments')
  }
  redirect(`/studio?persona=${result.status}`)
}

export async function deleteApprovedPersonaPublicationAction(formData: FormData): Promise<never> {
  await requireOwner()
  const result = await personaRepository.deleteApprovedPublication(idSchema.parse(formData.get('reviewId')))
  updateTag('moments:social')
  updateTag('content:moment')
  if (result.publishedSlug) {
    updateTag(`content:moment:${result.publishedSlug}`)
    updateTag('content:timeline')
  }
  revalidatePath('/moments')
  redirect('/studio?persona=publication-deleted')
}
