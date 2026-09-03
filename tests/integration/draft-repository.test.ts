import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import {
  ContentMustBeArchivedError,
  createContentRepository,
  DraftConflictError,
} from '@/modules/content/repository'
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

  it('loads a complete draft only through the Studio repository method', async () => {
    const created = await repository.createDraft({
      type: 'blog',
      slug: 'studio-draft',
      title: 'Studio Draft',
      subtitle: null,
      categoryLabel: null,
      summary: '',
      exposure: 'full',
      document: firstDocument,
    })

    await expect(repository.getDraftById(created.id)).resolves.toEqual(
      expect.objectContaining({
        id: created.id,
        slug: 'studio-draft',
        title: 'Studio Draft',
        revision: 1,
        document: firstDocument,
      }),
    )
    await expect(
      repository.getDraftById('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeNull()
  })

  it('filters the lightweight Studio catalog by query, type, and lifecycle status', async () => {
    const alpha = await repository.createDraft({
      type: 'blog', slug: 'alpha-note', title: 'Alpha Note', subtitle: null,
      categoryLabel: 'Journal', summary: '', exposure: 'full', document: firstDocument,
    })
    const beta = await repository.createDraft({
      type: 'project', slug: 'beta-project', title: 'Beta Project', subtitle: null,
      categoryLabel: 'Build', summary: '', exposure: 'full', document: firstDocument,
    })
    await repository.publishDraft({ entryId: beta.id })
    await repository.archiveContent({ entryId: alpha.id })

    await expect(repository.listStudioContent({ query: 'alpha' })).resolves.toEqual([
      expect.objectContaining({ id: alpha.id, status: 'archived', isPublic: false }),
    ])
    await expect(repository.listStudioContent({ type: 'project' })).resolves.toEqual([
      expect.objectContaining({ id: beta.id, status: 'published', isPublic: true }),
    ])
    await expect(repository.listStudioContent({ status: 'archived' })).resolves.toEqual([
      expect.objectContaining({ id: alpha.id }),
    ])
    const [item] = await repository.listStudioContent({})
    expect(item).not.toHaveProperty('document')
    expect(item).not.toHaveProperty('html')
  })

  it('archives a publication to 404 while preserving versions and restores only the draft lifecycle', async () => {
    const draft = await repository.createDraft({
      type: 'blog', slug: 'archive-me', title: 'Archive me', subtitle: null,
      categoryLabel: null, summary: '', exposure: 'full', document: firstDocument,
    })
    await repository.publishDraft({ entryId: draft.id })

    await expect(repository.archiveContent({ entryId: draft.id })).resolves.toEqual(
      expect.objectContaining({ id: draft.id, type: 'blog', slug: 'archive-me', hadPublication: true }),
    )
    await expect(repository.getPublicBySlug('blog', 'archive-me')).resolves.toBeNull()
    await expect(repository.getDraftById(draft.id)).resolves.toEqual(expect.objectContaining({ status: 'archived' }))
    expect((await pool.query('select 1 from content_versions where entry_id=$1', [draft.id])).rows).toHaveLength(1)

    await expect(repository.restoreArchivedContent({ entryId: draft.id })).resolves.toEqual(
      expect.objectContaining({ id: draft.id, status: 'draft' }),
    )
    await expect(repository.getPublicBySlug('blog', 'archive-me')).resolves.toBeNull()
  })

  it('permanently deletes only an archived entry and its immutable versions', async () => {
    const draft = await repository.createDraft({
      type: 'page', slug: 'temporary-page', title: 'Temporary page', subtitle: null,
      categoryLabel: null, summary: '', exposure: 'hidden', document: firstDocument,
    })
    await repository.publishDraft({ entryId: draft.id })
    await expect(repository.deleteArchivedContent({ entryId: draft.id })).rejects.toBeInstanceOf(ContentMustBeArchivedError)

    await repository.archiveContent({ entryId: draft.id })
    await expect(repository.deleteArchivedContent({ entryId: draft.id })).resolves.toEqual(
      expect.objectContaining({ id: draft.id, type: 'page', slug: 'temporary-page' }),
    )
    await expect(repository.getDraftById(draft.id)).resolves.toBeNull()
    expect((await pool.query('select 1 from content_versions where entry_id=$1', [draft.id])).rows).toHaveLength(0)
  })
})
