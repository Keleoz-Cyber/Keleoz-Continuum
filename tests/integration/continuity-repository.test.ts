import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createContentRepository } from '@/modules/content/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createContentRepository(drizzle(pool, { schema }))

function document(text: string) {
  return { type: 'doc' as const, content: [{ type: 'paragraph', attrs: { blockId: crypto.randomUUID() }, content: [{ type: 'text', text }] }] }
}

async function publish(input: {
  type: 'blog' | 'project' | 'moment' | 'page'
  slug: string
  title: string
  summary: string
  body: string
  exposure: 'full' | 'summary' | 'hidden'
  publishedAt: string
}) {
  const draft = await repository.createDraft({
    type: input.type,
    slug: input.slug,
    title: input.title,
    subtitle: null,
    categoryLabel: null,
    summary: input.summary,
    exposure: input.exposure,
    document: document(input.body),
  })
  await repository.publishDraft({ entryId: draft.id, now: new Date(input.publishedAt) })
}

beforeEach(async () => {
  await pool.query('delete from content_publications')
  await pool.query('delete from content_versions')
  await pool.query('delete from content_entries')
})

afterAll(async () => { await pool.end() })

describe('public continuity repository', () => {
  it('aggregates all public content types chronologically and excludes Hidden', async () => {
    await publish({ type: 'blog', slug: 'old-blog', title: 'Old Blog', summary: '', body: 'old', exposure: 'full', publishedAt: '2025-12-01T00:00:00.000Z' })
    await publish({ type: 'project', slug: 'new-project', title: 'New Project', summary: '', body: 'new', exposure: 'full', publishedAt: '2026-01-01T00:00:00.000Z' })
    await publish({ type: 'moment', slug: 'hidden-moment', title: 'Hidden Moment', summary: '', body: 'secret', exposure: 'hidden', publishedAt: '2026-02-01T00:00:00.000Z' })

    await expect(repository.listTimeline()).resolves.toEqual([
      expect.objectContaining({ type: 'project', slug: 'new-project' }),
      expect.objectContaining({ type: 'blog', slug: 'old-blog' }),
    ])
  })

  it('searches Full body text but never searches Summary or Hidden private bodies', async () => {
    await publish({ type: 'blog', slug: 'full-body', title: 'Public article', summary: '', body: 'A silver observatory needle.', exposure: 'full', publishedAt: '2026-01-03T00:00:00.000Z' })
    await publish({ type: 'project', slug: 'summary-only', title: 'Visible constellation', summary: 'Public constellation summary.', body: 'private observatory needle', exposure: 'summary', publishedAt: '2026-01-02T00:00:00.000Z' })
    await publish({ type: 'moment', slug: 'hidden-body', title: 'Hidden', summary: '', body: 'observatory needle', exposure: 'hidden', publishedAt: '2026-01-01T00:00:00.000Z' })

    const bodyMatches = await repository.searchPublic('observatory needle')
    expect(bodyMatches.map((result) => result.slug)).toEqual(['full-body'])
    expect(bodyMatches[0]?.snippet).toContain('observatory needle')

    const summaryMatches = await repository.searchPublic('constellation')
    expect(summaryMatches).toEqual([
      expect.objectContaining({ slug: 'summary-only', exposure: 'summary', snippet: 'Public constellation summary.' }),
    ])
    expect(JSON.stringify(summaryMatches)).not.toContain('private observatory needle')
  })
})
