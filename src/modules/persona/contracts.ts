import { z } from 'zod'

export type PersonaPermissions = {
  enabled: boolean
  canPost: boolean
  canComment: boolean
  canRepost: boolean
  canUseImages: boolean
}

const content = z.string().trim().min(1).max(800)
const imagePrompt = z.string().trim().min(1).max(500).nullable().optional().default(null)
const targetEntryId = z.uuid()
const targetCommentId = z.uuid()

export const personaReviewProposalSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('post'),
    content,
    imagePrompt,
    targetEntryId: z.null().optional().default(null),
    targetCommentId: z.null().optional().default(null),
  }).strict(),
  z.object({
    action: z.literal('comment'),
    content,
    imagePrompt: z.null().optional().default(null),
    targetEntryId,
    targetCommentId: z.null().optional().default(null),
  }).strict(),
  z.object({
    action: z.literal('reply'),
    content,
    imagePrompt: z.null().optional().default(null),
    targetEntryId,
    targetCommentId,
  }).strict(),
  z.object({
    action: z.literal('repost'),
    content,
    imagePrompt,
    targetEntryId,
    targetCommentId: z.null().optional().default(null),
  }).strict(),
])

export type PersonaReviewProposal = z.infer<typeof personaReviewProposalSchema>

export function assertPersonaCanPropose(
  permissions: PersonaPermissions,
  proposal: PersonaReviewProposal,
): void {
  if (!permissions.enabled) throw new Error('Persona is disabled')
  if (proposal.action === 'post' && !permissions.canPost) {
    throw new Error('Persona does not have post permission')
  }
  if ((proposal.action === 'comment' || proposal.action === 'reply') && !permissions.canComment) {
    throw new Error('Persona does not have comment permission')
  }
  if (proposal.action === 'repost' && !permissions.canRepost) {
    throw new Error('Persona does not have repost permission')
  }
  if (proposal.imagePrompt && !permissions.canUseImages) {
    throw new Error('Persona does not have image permission')
  }
}

export function parsePersonaAiProposal(
  value: string,
  context: Pick<PersonaReviewProposal, 'action' | 'targetEntryId' | 'targetCommentId'>,
): PersonaReviewProposal {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('Persona proposal must be strict JSON')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Persona proposal must be a JSON object')
  }
  return personaReviewProposalSchema.parse({ ...parsed, ...context })
}
