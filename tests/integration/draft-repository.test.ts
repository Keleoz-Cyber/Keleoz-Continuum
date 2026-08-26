import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createContentRepository, DraftConflictError } from '@/modules/content/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createContentRepository(drizzle(pool, { schema }))

const firstDocument = {
  type: 'doc' as const,
  content: [
    {
      type: 'paragraph',
      attrs: { blockId: 'p-1' },
      content: [{ type: 'text', text: 'First light.' }],
    },
  ],
}

beforeEach(async () => {
  await pool.query('delete from content_publications')
  await pool.query('delete from content_versions')
  await pool.query('delete from content_entries')
})

afterAll(async () => {
  await pool.end()
})

describe('draft repository', () => {
  it('increments revisions and rejects a stale autosave', async () => {
    const draft = await repository.createDraft({
      type: 'blog',
      slug: 'First Light',
      title: 'First Light',
      subtitle: null,
      categoryLabel: 'Notes',
      summary: 'A beginning.',
      exposure: 'full',
      document: firstDocument,
    })

    expect(draft.revision).toBe(1)

    const saved = await repository.saveDraft({
      entryId: draft.id,
      expectedRevision: 1,
      snapshot: {
        title: 'First Light, revised',
        subtitle: null,
        categoryLabel: 'Notes',
        summary: 'A beginning.',
        exposure: 'full',
        document: firstDocument,
      },
    })
    expect(saved.revision).toBe(2)

    await expect(
      repository.saveDraft({
        entryId: draft.id,
        expectedRevision: 1,
        snapshot: {
          title: 'Stale title',
          subtitle: null,
          categoryLabel: null,
          summary: '',
          exposure: 'full',
          document: firstDocument,
        },
      }),
    ).rejects.toMatchObject({
      name: 'DraftConflictError',
      currentRevision: 2,
    } satisfies Partial<DraftConflictError>)
  })

  it('lists metadata without serializing draft bodies', async () => {
    await repository.createDraft({
      type: 'blog',
      slug: 'first-light',
      title: 'First Light',
      subtitle: null,
      categoryLabel: null,
      summary: 'A beginning.',
      exposure: 'summary',
      document: firstDocument,
    })

    const [item] = await repository.listStudioDrafts()

    expect(item).toEqual(
      expect.objectContaining({
        slug: 'first-light',
        title: 'First Light',
        revision: 1,
      }),
    )
    expect(item).not.toHaveProperty('draftDocument')
    expect(item).not.toHaveProperty('draftHtml')
    expect(item).not.toHaveProperty('draftPlainText')
  })
})
