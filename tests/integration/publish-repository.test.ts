import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createContentRepository } from '@/modules/content/repository'
import { PublishedSlugChangeError } from '@/modules/content/slug'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createContentRepository(drizzle(pool, { schema }))

function paragraphDocument(text: string) {
  return {
    type: 'doc' as const,
    content: [
      {
        type: 'paragraph',
        attrs: { blockId: 'p-1' },
        content: [{ type: 'text', text }],
      },
    ],
  }
}

async function createDraft(exposure: 'full' | 'summary' | 'hidden' = 'full') {
  return repository.createDraft({
    type: 'blog',
    slug: 'first-light',
    title: 'First Light',
    subtitle: null,
    categoryLabel: 'Notes',
    summary: 'Public summary',
    exposure,
    document: paragraphDocument('Version one body.'),
  })
}

beforeEach(async () => {
  await pool.query('delete from content_publications')
  await pool.query('delete from content_versions')
  await pool.query('delete from content_entries')
})

afterAll(async () => {
  await pool.end()
})

describe('content publication', () => {
  it('creates immutable versions and moves only the publication pointer', async () => {
    const draft = await createDraft('full')
    const first = await repository.publishDraft({
      entryId: draft.id,
      now: new Date('2026-08-27T00:00:00.000Z'),
    })

    expect(first.versionNumber).toBe(1)
    expect(first.projection?.bodyHtml).toContain('Version one body.')

    await repository.saveDraft({
      entryId: draft.id,
      expectedRevision: 1,
      snapshot: {
        title: 'First Light, revised',
        subtitle: null,
        categoryLabel: 'Notes',
        summary: 'Public summary',
        exposure: 'full',
        document: paragraphDocument('Version two body.'),
      },
    })
    const second = await repository.publishDraft({
      entryId: draft.id,
      now: new Date('2026-08-27T01:00:00.000Z'),
    })

    expect(second.versionNumber).toBe(2)
    expect(second.versionId).not.toBe(first.versionId)

    const versions = await pool.query<{
      id: string
      version_number: number
      rendered_html: string
    }>(
      'select id, version_number, rendered_html from content_versions where entry_id = $1 order by version_number',
      [draft.id],
    )
    expect(versions.rows).toHaveLength(2)
    expect(versions.rows[0]?.rendered_html).toContain('Version one body.')
    expect(versions.rows[1]?.rendered_html).toContain('Version two body.')

    const pointer = await pool.query<{ version_id: string }>(
      'select version_id from content_publications where entry_id = $1',
      [draft.id],
    )
    expect(pointer.rows[0]?.version_id).toBe(second.versionId)
  })

  it('keeps the previous publication when the new draft cannot render', async () => {
    const draft = await createDraft('full')
    const first = await repository.publishDraft({ entryId: draft.id })

    await pool.query(
      `update content_entries
       set draft_document = '{"type":"broken"}'::jsonb,
           draft_revision = draft_revision + 1
       where id = $1`,
      [draft.id],
    )

    await expect(repository.publishDraft({ entryId: draft.id })).rejects.toThrow()

    const pointer = await pool.query<{ version_id: string }>(
      'select version_id from content_publications where entry_id = $1',
      [draft.id],
    )
    expect(pointer.rows[0]?.version_id).toBe(first.versionId)
  })

  it('enforces Summary and Hidden at the public query boundary', async () => {
    const draft = await createDraft('summary')
    await repository.publishDraft({
      entryId: draft.id,
      now: new Date('2026-08-27T02:00:00.000Z'),
    })

    await expect(repository.getPublicBySlug('first-light')).resolves.toEqual(
      expect.objectContaining({
        exposure: 'summary',
        summary: 'Public summary',
        bodyHtml: null,
      }),
    )

    await repository.saveDraft({
      entryId: draft.id,
      expectedRevision: 1,
      snapshot: {
        title: 'First Light',
        subtitle: null,
        categoryLabel: 'Notes',
        summary: 'Public summary',
        exposure: 'hidden',
        document: paragraphDocument('Never sent to guests.'),
      },
    })
    await repository.publishDraft({ entryId: draft.id })

    await expect(repository.getPublicBySlug('first-light')).resolves.toBeNull()
  })

  it('locks the slug after the first publication', async () => {
    const draft = await createDraft('full')
    await repository.publishDraft({ entryId: draft.id })

    await expect(
      repository.updateDraftSlug({ entryId: draft.id, requestedSlug: 'second-light' }),
    ).rejects.toBeInstanceOf(PublishedSlugChangeError)
  })

  it('lists only lightweight Full and Summary metadata', async () => {
    for (const [slug, exposure] of [
      ['full-entry', 'full'],
      ['summary-entry', 'summary'],
      ['hidden-entry', 'hidden'],
    ] as const) {
      const draft = await repository.createDraft({
        type: 'blog',
        slug,
        title: slug,
        subtitle: null,
        categoryLabel: null,
        summary: `${slug} summary`,
        exposure,
        document: paragraphDocument(`${slug} private body`),
      })
      await repository.publishDraft({ entryId: draft.id })
    }

    const list = await repository.listPublic('blog')

    expect(list.map((item) => item.slug).sort()).toEqual(['full-entry', 'summary-entry'])
    for (const item of list) {
      expect(item).not.toHaveProperty('bodyHtml')
      expect(item).not.toHaveProperty('renderedHtml')
      expect(item).not.toHaveProperty('document')
      expect(item).not.toHaveProperty('plainText')
    }
  })
})
