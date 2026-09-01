import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { z } from 'zod'

import {
  contentEntries, contentMedia, contentPublications, contentVersions, mediaObjects, mediaVariants,
  momentAuthorships, momentComments, momentPersonas, personaReviews,
} from '@/db/schema'
import type * as schema from '@/db/schema'
import { parseAndRenderDocument } from '@/modules/content/document'
import {
  assertPersonaCanPropose, personaReviewProposalSchema, type PersonaReviewProposal,
} from '@/modules/persona/contracts'

const personaInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{1,79}$/),
  description: z.string().trim().max(2_000),
  systemPrompt: z.string().trim().min(1).max(8_000),
  enabled: z.boolean(), canPost: z.boolean(), canComment: z.boolean(),
  canRepost: z.boolean(), canUseImages: z.boolean(),
})
const editedContentSchema = z.string().trim().min(1).max(800)

export type PublicMomentAuthor = { name: string; handle: string; isAi: boolean }
export type PublicMomentItem = {
  entryId: string; type: 'moment'; slug: string; title: string; subtitle: string | null
  categoryLabel: string | null; summary: string; exposure: 'full' | 'summary'
  bodyHtml: string | null; publishedAt: string; author: PublicMomentAuthor
  comments: Array<{ id: string; content: string; createdAt: string; author: PublicMomentAuthor; replyToName: string | null }>
  repost: null | { slug: string; title: string; summary: string; author: PublicMomentAuthor }
  media: Array<{
    id: string
    altText: string
    variants: Array<{ name: string; mimeType: string; width: number; height: number; publicUrl: string }>
  }>
}

const OWNER_AUTHOR: PublicMomentAuthor = { name: 'Keleoz', handle: '@KeleozContinuum', isAi: false }
const personaAuthor = (persona: { name: string; handle: string }): PublicMomentAuthor =>
  ({ name: persona.name, handle: `@${persona.handle}`, isAi: true })
const momentDocument = (content: string) => ({
  type: 'doc' as const, content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }],
})
function momentTitle(content: string) {
  const compact = content.replace(/\s+/g, ' ').trim()
  return compact.length > 54 ? `${compact.slice(0, 53)}…` : compact
}
function momentSlug(handle: string, reviewId: string, now: Date) {
  return `${handle}-${now.toISOString().replace(/\D/g, '').slice(0, 14)}-${reviewId.slice(0, 8)}`
}

export function createPersonaRepository(
  database: NodePgDatabase<typeof schema>,
  options: { mediaPublicUrl?: (key: string) => string } = {},
) {
  const mediaPublicUrl = options.mediaPublicUrl ?? ((key: string) => key)
  async function assertPublishedMoment(entryId: string) {
    const [target] = await database.select({ id: contentEntries.id }).from(contentEntries)
      .innerJoin(contentPublications, eq(contentPublications.entryId, contentEntries.id))
      .where(and(eq(contentEntries.id, entryId), eq(contentEntries.type, 'moment'))).limit(1)
    if (!target) throw new Error('Target Moment is not publicly published')
  }

  async function listPublicMoments(): Promise<PublicMomentItem[]> {
    const rows = await database.select({
      entryId: contentPublications.entryId, slug: contentVersions.slug, title: contentVersions.title,
      subtitle: contentVersions.subtitle, categoryLabel: contentVersions.categoryLabel,
      summary: contentVersions.summary, exposure: contentVersions.exposure,
      renderedHtml: contentVersions.renderedHtml, publishedAt: contentPublications.publishedAt,
      personaName: momentPersonas.name, personaHandle: momentPersonas.handle,
      repostOfEntryId: momentAuthorships.repostOfEntryId,
    }).from(contentPublications)
      .innerJoin(contentVersions, eq(contentPublications.versionId, contentVersions.id))
      .leftJoin(momentAuthorships, eq(momentAuthorships.entryId, contentPublications.entryId))
      .leftJoin(momentPersonas, eq(momentPersonas.id, momentAuthorships.personaId))
      .where(and(eq(contentVersions.type, 'moment'), ne(contentVersions.exposure, 'hidden')))
      .orderBy(desc(contentPublications.publishedAt))
    if (!rows.length) return []

    const entryIds = rows.map((row) => row.entryId)
    const commentRows = await database.select({
      id: momentComments.id, entryId: momentComments.entryId,
      parentCommentId: momentComments.parentCommentId, content: momentComments.content,
      createdAt: momentComments.createdAt, personaName: momentPersonas.name,
      personaHandle: momentPersonas.handle,
    }).from(momentComments)
      .innerJoin(momentPersonas, eq(momentPersonas.id, momentComments.personaId))
      .where(inArray(momentComments.entryId, entryIds)).orderBy(asc(momentComments.createdAt))
    const commentAuthorById = new Map(commentRows.map((comment) => [comment.id, comment.personaName]))
    const commentsByEntry = new Map<string, PublicMomentItem['comments']>()
    for (const comment of commentRows) {
      const list = commentsByEntry.get(comment.entryId) ?? []
      list.push({
        id: comment.id, content: comment.content, createdAt: comment.createdAt.toISOString(),
        author: personaAuthor({ name: comment.personaName, handle: comment.personaHandle }),
        replyToName: comment.parentCommentId ? commentAuthorById.get(comment.parentCommentId) ?? null : null,
      })
      commentsByEntry.set(comment.entryId, list)
    }

    const repostIds = rows.flatMap((row) => row.repostOfEntryId ? [row.repostOfEntryId] : [])
    const repostById = new Map<string, NonNullable<PublicMomentItem['repost']>>()
    if (repostIds.length) {
      const repostRows = await database.select({
        entryId: contentPublications.entryId, slug: contentVersions.slug,
        title: contentVersions.title, summary: contentVersions.summary,
        personaName: momentPersonas.name, personaHandle: momentPersonas.handle,
      }).from(contentPublications)
        .innerJoin(contentVersions, eq(contentPublications.versionId, contentVersions.id))
        .leftJoin(momentAuthorships, eq(momentAuthorships.entryId, contentPublications.entryId))
        .leftJoin(momentPersonas, eq(momentPersonas.id, momentAuthorships.personaId))
        .where(and(inArray(contentPublications.entryId, repostIds), ne(contentVersions.exposure, 'hidden')))
      for (const repost of repostRows) repostById.set(repost.entryId, {
        slug: repost.slug, title: repost.title, summary: repost.summary,
        author: repost.personaName && repost.personaHandle
          ? personaAuthor({ name: repost.personaName, handle: repost.personaHandle }) : OWNER_AUTHOR,
      })
    }

    const mediaRows = await database.select({
      entryId: contentMedia.entryId,
      mediaId: mediaObjects.id,
      relationAltText: contentMedia.altText,
      objectAltText: mediaObjects.altText,
      name: mediaVariants.name,
      storageKey: mediaVariants.storageKey,
      mimeType: mediaVariants.mimeType,
      width: mediaVariants.width,
      height: mediaVariants.height,
    }).from(contentMedia)
      .innerJoin(mediaObjects, eq(mediaObjects.id, contentMedia.mediaId))
      .innerJoin(mediaVariants, eq(mediaVariants.mediaId, mediaObjects.id))
      .where(and(inArray(contentMedia.entryId, entryIds), eq(mediaObjects.state, 'ready')))
      .orderBy(asc(contentMedia.position), asc(mediaVariants.name))
    const mediaByEntry = new Map<string, PublicMomentItem['media']>()
    for (const media of mediaRows) {
      const list = mediaByEntry.get(media.entryId) ?? []
      let item = list.find((candidate) => candidate.id === media.mediaId)
      if (!item) {
        item = { id: media.mediaId, altText: media.relationAltText || media.objectAltText, variants: [] }
        list.push(item)
      }
      item.variants.push({
        name: media.name,
        mimeType: media.mimeType,
        width: media.width,
        height: media.height,
        publicUrl: mediaPublicUrl(media.storageKey),
      })
      mediaByEntry.set(media.entryId, list)
    }

    return rows.map((row) => ({
      entryId: row.entryId, type: 'moment' as const, slug: row.slug, title: row.title,
      subtitle: row.subtitle, categoryLabel: row.categoryLabel, summary: row.summary,
      exposure: row.exposure === 'summary' ? 'summary' : 'full',
      bodyHtml: row.exposure === 'summary' ? null : row.renderedHtml,
      publishedAt: row.publishedAt.toISOString(),
      author: row.personaName && row.personaHandle
        ? personaAuthor({ name: row.personaName, handle: row.personaHandle }) : OWNER_AUTHOR,
      comments: commentsByEntry.get(row.entryId) ?? [],
      repost: row.repostOfEntryId ? repostById.get(row.repostOfEntryId) ?? null : null,
      media: mediaByEntry.get(row.entryId) ?? [],
    }))
  }

  return {
    async createPersona(input: z.input<typeof personaInputSchema>) {
      const parsed = personaInputSchema.parse(input)
      const [persona] = await database.insert(momentPersonas).values(parsed).returning()
      if (!persona) throw new Error('Persona insert did not return a row')
      return persona
    },
    async updatePersona(input: { id: string } & z.input<typeof personaInputSchema>) {
      const { id, ...values } = input
      const [persona] = await database.update(momentPersonas)
        .set({ ...personaInputSchema.parse(values), updatedAt: new Date() })
        .where(eq(momentPersonas.id, z.uuid().parse(id))).returning()
      if (!persona) throw new Error('Persona was not found')
      return persona
    },
    async listPersonas() { return database.select().from(momentPersonas).orderBy(asc(momentPersonas.createdAt)) },
    async getPersona(id: string) {
      const [persona] = await database.select().from(momentPersonas)
        .where(eq(momentPersonas.id, z.uuid().parse(id))).limit(1)
      return persona ?? null
    },
    async createReview(input: { personaId: string; proposal: PersonaReviewProposal; now?: Date }) {
      const personaId = z.uuid().parse(input.personaId)
      const proposal = personaReviewProposalSchema.parse(input.proposal)
      const [persona] = await database.select().from(momentPersonas)
        .where(eq(momentPersonas.id, personaId)).limit(1)
      if (!persona) throw new Error('Persona was not found')
      assertPersonaCanPropose(persona, proposal)
      if (proposal.targetEntryId) await assertPublishedMoment(proposal.targetEntryId)
      if (proposal.action === 'reply') {
        const [parent] = await database.select({ id: momentComments.id }).from(momentComments)
          .where(and(eq(momentComments.id, proposal.targetCommentId), eq(momentComments.entryId, proposal.targetEntryId))).limit(1)
        if (!parent) throw new Error('Reply target comment was not found on the target Moment')
      }
      const [review] = await database.insert(personaReviews).values({
        personaId, action: proposal.action, targetEntryId: proposal.targetEntryId,
        targetCommentId: proposal.targetCommentId, content: proposal.content,
        imagePrompt: proposal.imagePrompt, createdAt: input.now,
      }).returning()
      if (!review) throw new Error('Persona review insert did not return a row')
      return review
    },
    async listReviews() {
      return database.select({
        id: personaReviews.id, action: personaReviews.action, status: personaReviews.status,
        content: personaReviews.content, reviewedContent: personaReviews.reviewedContent,
        imagePrompt: personaReviews.imagePrompt, mediaObjectId: personaReviews.mediaObjectId,
        targetEntryId: personaReviews.targetEntryId,
        targetCommentId: personaReviews.targetCommentId, publishedEntryId: personaReviews.publishedEntryId,
        publishedCommentId: personaReviews.publishedCommentId, createdAt: personaReviews.createdAt,
        reviewedAt: personaReviews.reviewedAt, personaId: momentPersonas.id,
        personaName: momentPersonas.name, personaHandle: momentPersonas.handle,
      }).from(personaReviews).innerJoin(momentPersonas, eq(personaReviews.personaId, momentPersonas.id))
        .orderBy(desc(personaReviews.createdAt))
    },
    async moderateReview(input: {
      reviewId: string; decision: 'approved' | 'rejected' | 'deleted'; editedContent?: string
      mediaObjectId?: string | null; now?: Date
    }) {
      const reviewId = z.uuid().parse(input.reviewId)
      const now = input.now ?? new Date()
      return database.transaction(async (transaction) => {
        const [review] = await transaction.select().from(personaReviews)
          .where(eq(personaReviews.id, reviewId)).limit(1).for('update')
        if (!review) throw new Error('Persona review was not found')
        if (review.status !== 'pending') throw new Error('Only pending Persona reviews can be moderated')
        const [persona] = await transaction.select().from(momentPersonas)
          .where(eq(momentPersonas.id, review.personaId)).limit(1).for('update')
        if (!persona) throw new Error('Persona was not found')
        const content = input.editedContent === undefined ? review.content : editedContentSchema.parse(input.editedContent)
        const selectedMediaId = input.mediaObjectId === undefined
          ? review.mediaObjectId
          : input.mediaObjectId ? z.uuid().parse(input.mediaObjectId) : null
        if (input.decision !== 'approved') {
          const [closed] = await transaction.update(personaReviews).set({
            status: input.decision, reviewedContent: input.editedContent === undefined ? null : content,
            mediaObjectId: selectedMediaId, reviewedAt: now,
          }).where(eq(personaReviews.id, review.id)).returning()
          return { ...closed!, publishedSlug: null }
        }
        const proposal = personaReviewProposalSchema.parse({
          action: review.action, content, imagePrompt: review.imagePrompt,
          targetEntryId: review.targetEntryId, targetCommentId: review.targetCommentId,
        })
        assertPersonaCanPropose(persona, proposal)
        if (selectedMediaId && !persona.canUseImages) throw new Error('Persona does not have image permission')
        if (selectedMediaId && (proposal.action === 'comment' || proposal.action === 'reply')) {
          throw new Error('Only Persona posts and reposts can attach media')
        }
        let selectedMedia: { id: string; altText: string } | null = null
        if (selectedMediaId) {
          const [readyMedia] = await transaction.select({ id: mediaObjects.id, altText: mediaObjects.altText })
            .from(mediaObjects)
            .where(and(eq(mediaObjects.id, selectedMediaId), eq(mediaObjects.state, 'ready'))).limit(1)
          if (!readyMedia) throw new Error('Selected media is not ready')
          selectedMedia = readyMedia
        }
        let publishedEntryId: string | null = null
        let publishedCommentId: string | null = null
        let publishedSlug: string | null = null
        if (proposal.action === 'comment' || proposal.action === 'reply') {
          const [target] = await transaction.select({ id: contentEntries.id }).from(contentEntries)
            .innerJoin(contentPublications, eq(contentPublications.entryId, contentEntries.id))
            .where(and(eq(contentEntries.id, proposal.targetEntryId), eq(contentEntries.type, 'moment'))).limit(1)
          if (!target) throw new Error('Target Moment is not publicly published')
          if (proposal.action === 'reply') {
            const [parent] = await transaction.select({ id: momentComments.id }).from(momentComments)
              .where(and(eq(momentComments.id, proposal.targetCommentId), eq(momentComments.entryId, proposal.targetEntryId))).limit(1)
            if (!parent) throw new Error('Reply target comment was not found on the target Moment')
          }
          const [comment] = await transaction.insert(momentComments).values({
            entryId: proposal.targetEntryId, personaId: persona.id,
            parentCommentId: proposal.targetCommentId, content, createdAt: now,
          }).returning({ id: momentComments.id })
          if (!comment) throw new Error('Approved comment insert did not return a row')
          publishedCommentId = comment.id
        } else {
          if (proposal.action === 'repost') {
            const [target] = await transaction.select({ id: contentEntries.id }).from(contentEntries)
              .innerJoin(contentPublications, eq(contentPublications.entryId, contentEntries.id))
              .where(and(eq(contentEntries.id, proposal.targetEntryId), eq(contentEntries.type, 'moment'))).limit(1)
            if (!target) throw new Error('Target Moment is not publicly published')
          }
          const rendered = parseAndRenderDocument(momentDocument(content))
          publishedSlug = momentSlug(persona.handle, review.id, now)
          const [entry] = await transaction.insert(contentEntries).values({
            type: 'moment', slug: publishedSlug, title: momentTitle(content), summary: content,
            exposure: 'full', status: 'published', draftDocument: rendered.document,
            draftHtml: rendered.html, draftPlainText: rendered.plainText,
            createdAt: now, updatedAt: now,
          }).returning({ id: contentEntries.id })
          if (!entry) throw new Error('Approved Moment insert did not return a row')
          const [version] = await transaction.insert(contentVersions).values({
            entryId: entry.id, versionNumber: 1, slug: publishedSlug, type: 'moment',
            title: momentTitle(content), summary: content, exposure: 'full', document: rendered.document,
            renderedHtml: rendered.html, plainText: rendered.plainText, createdAt: now,
          }).returning({ id: contentVersions.id })
          if (!version) throw new Error('Approved Moment version insert did not return a row')
          await transaction.insert(contentPublications).values({ entryId: entry.id, versionId: version.id, publishedAt: now })
          await transaction.insert(momentAuthorships).values({
            entryId: entry.id, personaId: persona.id,
            repostOfEntryId: proposal.action === 'repost' ? proposal.targetEntryId : null, createdAt: now,
          })
          if (selectedMedia) {
            await transaction.insert(contentMedia).values({
              entryId: entry.id,
              mediaId: selectedMedia.id,
              position: 0,
              altText: selectedMedia.altText,
              createdAt: now,
            })
          }
          publishedEntryId = entry.id
        }
        const [approved] = await transaction.update(personaReviews).set({
          status: 'approved', reviewedContent: input.editedContent === undefined ? null : content,
          mediaObjectId: selectedMediaId, publishedEntryId, publishedCommentId, reviewedAt: now,
        }).where(eq(personaReviews.id, review.id)).returning()
        return { ...approved!, publishedSlug }
      })
    },
    async deleteApprovedPublication(reviewIdInput: string) {
      const reviewId = z.uuid().parse(reviewIdInput)
      return database.transaction(async (transaction) => {
        const [review] = await transaction.select().from(personaReviews)
          .where(eq(personaReviews.id, reviewId)).limit(1).for('update')
        if (!review || review.status !== 'approved') {
          throw new Error('Only an approved Persona review publication can be deleted')
        }
        let publishedSlug: string | null = null
        if (review.publishedEntryId) {
          const [entry] = await transaction.select({ slug: contentEntries.slug }).from(contentEntries)
            .where(eq(contentEntries.id, review.publishedEntryId)).limit(1)
          publishedSlug = entry?.slug ?? null
          await transaction.delete(contentEntries).where(eq(contentEntries.id, review.publishedEntryId))
        }
        if (review.publishedCommentId) {
          await transaction.delete(momentComments).where(eq(momentComments.id, review.publishedCommentId))
        }
        const [deleted] = await transaction.update(personaReviews).set({
          status: 'deleted',
          publishedEntryId: null,
          publishedCommentId: null,
          reviewedAt: new Date(),
        }).where(eq(personaReviews.id, review.id)).returning()
        return { ...deleted!, publishedSlug }
      })
    },
    listPublicMoments,
    async getPublicMomentBySlug(slug: string) {
      const moments = await listPublicMoments()
      return moments.find((moment) => moment.slug === slug) ?? null
    },
  }
}
