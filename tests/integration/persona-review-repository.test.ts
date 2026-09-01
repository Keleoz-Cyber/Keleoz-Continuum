import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createContentRepository } from '@/modules/content/repository'
import { createMediaRepository } from '@/modules/media/repository'
import { createPersonaRepository } from '@/modules/persona/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const database = drizzle(pool, { schema })
const repository = createPersonaRepository(database, { mediaPublicUrl: (key) => `/media-test/${key}` })
const contentRepository = createContentRepository(database)
const mediaRepository = createMediaRepository(database)

const allPermissions = {
  enabled: true,
  canPost: true,
  canComment: true,
  canRepost: true,
  canUseImages: true,
}

function paragraphDocument(text: string) {
  return { type: 'doc' as const, content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

async function createOwnerMoment() {
  const draft = await contentRepository.createDraft({
    type: 'moment', slug: 'owner-rain', title: 'Rain', subtitle: null,
    categoryLabel: null, summary: '雨落在窗上。', exposure: 'full',
    document: paragraphDocument('雨落在窗上。'),
  })
  await contentRepository.publishDraft({ entryId: draft.id, now: new Date('2026-08-31T08:00:00Z') })
  return draft
}

beforeEach(async () => {
  await pool.query('delete from persona_reviews')
  await pool.query('delete from moment_comments')
  await pool.query('delete from moment_authorships')
  await pool.query('delete from moment_personas')
  await pool.query('delete from content_publications')
  await pool.query('delete from content_versions')
  await pool.query('delete from content_entries')
  await pool.query('delete from media_variants')
  await pool.query('delete from media_objects')
})

afterAll(async () => pool.end())

describe('Persona review repository', () => {
  it('stores a permitted proposal as pending and never exposes it before approval', async () => {
    const persona = await repository.createPersona({
      name: 'Morrow', handle: 'morrow', description: '窗边的观察者。', systemPrompt: '克制、具体。',
      ...allPermissions,
    })
    const review = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'post', content: '雾沿着玻璃慢慢退开。', imagePrompt: null, targetEntryId: null, targetCommentId: null },
      now: new Date('2026-08-31T09:00:00Z'),
    })

    expect(review).toMatchObject({ status: 'pending', action: 'post' })
    await expect(repository.listPublicMoments()).resolves.toEqual([])
  })

  it('rechecks current permissions and materializes an approved post with clear AI identity', async () => {
    const persona = await repository.createPersona({
      name: 'Morrow', handle: 'morrow', description: '窗边的观察者。', systemPrompt: '克制、具体。',
      ...allPermissions,
    })
    const review = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'post', content: '初稿。', imagePrompt: null, targetEntryId: null, targetCommentId: null },
      now: new Date('2026-08-31T09:00:00Z'),
    })
    const approved = await repository.moderateReview({
      reviewId: review.id, decision: 'approved', editedContent: 'Owner 编辑后的公开动态。',
      now: new Date('2026-08-31T09:05:00Z'),
    })

    expect(approved).toMatchObject({ status: 'approved', publishedSlug: expect.stringContaining('morrow-') })
    await expect(repository.listPublicMoments()).resolves.toEqual([
      expect.objectContaining({
        summary: 'Owner 编辑后的公开动态。',
        author: expect.objectContaining({ name: 'Morrow', handle: '@morrow', isAi: true }),
      }),
    ])
    await expect(repository.moderateReview({ reviewId: review.id, decision: 'approved' }))
      .rejects.toThrow('pending')
  })

  it('publishes approved comments, replies, and reposts in the source Circle hierarchy', async () => {
    const ownerMoment = await createOwnerMoment()
    const persona = await repository.createPersona({
      name: 'Morrow', handle: 'morrow', description: '', systemPrompt: '克制、具体。',
      ...allPermissions,
    })
    const commentReview = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'comment', content: '听见了雨声。', imagePrompt: null, targetEntryId: ownerMoment.id, targetCommentId: null },
    })
    const comment = await repository.moderateReview({ reviewId: commentReview.id, decision: 'approved' })
    const replyReview = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'reply', content: '也看见了倒影。', imagePrompt: null, targetEntryId: ownerMoment.id, targetCommentId: comment.publishedCommentId! },
    })
    await repository.moderateReview({ reviewId: replyReview.id, decision: 'approved' })
    const repostReview = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'repost', content: '把这场雨带回时间线。', imagePrompt: null, targetEntryId: ownerMoment.id, targetCommentId: null },
    })
    await repository.moderateReview({ reviewId: repostReview.id, decision: 'approved' })

    const moments = await repository.listPublicMoments()
    expect(moments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: 'owner-rain',
        comments: [
          expect.objectContaining({ content: '听见了雨声。', replyToName: null }),
          expect.objectContaining({ content: '也看见了倒影。', replyToName: 'Morrow' }),
        ],
      }),
      expect.objectContaining({
        author: expect.objectContaining({ handle: '@morrow', isAi: true }),
        repost: expect.objectContaining({ slug: 'owner-rain', summary: '雨落在窗上。' }),
      }),
    ]))
  })

  it('rejects or deletes proposals without producing public writes', async () => {
    const persona = await repository.createPersona({
      name: 'Morrow', handle: 'morrow', description: '', systemPrompt: '克制、具体。',
      ...allPermissions,
    })
    for (const decision of ['rejected', 'deleted'] as const) {
      const review = await repository.createReview({
        personaId: persona.id,
        proposal: { action: 'post', content: `${decision} draft`, imagePrompt: null, targetEntryId: null, targetCommentId: null },
      })
      await expect(repository.moderateReview({ reviewId: review.id, decision }))
        .resolves.toMatchObject({ status: decision })
    }
    await expect(repository.listPublicMoments()).resolves.toEqual([])
  })

  it('lets the Owner delete an already-approved Persona publication through its review audit row', async () => {
    const persona = await repository.createPersona({
      name: 'Morrow', handle: 'morrow', description: '', systemPrompt: '克制、具体。',
      ...allPermissions,
    })
    const review = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'post', content: '稍后删除的公开动态。', imagePrompt: null, targetEntryId: null, targetCommentId: null },
    })
    await repository.moderateReview({ reviewId: review.id, decision: 'approved' })
    await expect(repository.listPublicMoments()).resolves.toHaveLength(1)

    await expect(repository.deleteApprovedPublication(review.id)).resolves.toMatchObject({ status: 'deleted' })
    await expect(repository.listPublicMoments()).resolves.toEqual([])
  })

  it('attaches only a ready reviewed library image to an approved post', async () => {
    const persona = await repository.createPersona({
      name: 'Morrow', handle: 'morrow', description: '', systemPrompt: '克制、具体。',
      ...allPermissions,
    })
    const mediaId = crypto.randomUUID()
    await mediaRepository.createPending({
      id: mediaId, storageKey: `media/2026/08/${mediaId}/large.webp`,
      originalName: 'mist.png', mimeType: 'image/webp', byteSize: 120,
      sha256: 'a'.repeat(64), altText: '雾窗与蝴蝶', width: 1_200, height: 800,
      now: new Date('2026-08-31T10:00:00Z'),
    })
    await mediaRepository.markReady({
      id: mediaId,
      variants: [
        { name: 'card-webp', storageKey: `media/2026/08/${mediaId}/card.webp`, mimeType: 'image/webp', byteSize: 80, width: 960, height: 640 },
        { name: 'large-webp', storageKey: `media/2026/08/${mediaId}/large.webp`, mimeType: 'image/webp', byteSize: 120, width: 1_200, height: 800 },
      ],
      now: new Date('2026-08-31T10:00:01Z'),
    })
    const review = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'post', content: '带一张审核后的图。', imagePrompt: '雾窗', targetEntryId: null, targetCommentId: null },
    })
    await repository.moderateReview({ reviewId: review.id, decision: 'approved', mediaObjectId: mediaId })

    await expect(repository.listPublicMoments()).resolves.toEqual([
      expect.objectContaining({
        media: [{
          id: mediaId,
          altText: '雾窗与蝴蝶',
          variants: expect.arrayContaining([
            expect.objectContaining({ name: 'card-webp', publicUrl: expect.stringContaining('/card.webp') }),
            expect.objectContaining({ name: 'large-webp', publicUrl: expect.stringContaining('/large.webp') }),
          ]),
        }],
      }),
    ])

    const pendingId = crypto.randomUUID()
    await mediaRepository.createPending({
      id: pendingId, storageKey: `media/2026/08/${pendingId}/large.webp`, originalName: 'pending.png',
      mimeType: 'image/webp', byteSize: 1, sha256: 'b'.repeat(64), altText: '', width: 10, height: 10, now: new Date(),
    })
    const second = await repository.createReview({
      personaId: persona.id,
      proposal: { action: 'post', content: '不能带未完成图片。', imagePrompt: null, targetEntryId: null, targetCommentId: null },
    })
    await expect(repository.moderateReview({ reviewId: second.id, decision: 'approved', mediaObjectId: pendingId }))
      .rejects.toThrow('ready')
  })
})
