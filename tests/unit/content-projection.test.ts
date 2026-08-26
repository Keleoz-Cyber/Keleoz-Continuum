import { describe, expect, it } from 'vitest'

import { projectPublishedVersion } from '@/modules/content/projection'

const baseVersion = {
  type: 'blog' as const,
  slug: 'first-light',
  title: 'First Light',
  subtitle: null,
  categoryLabel: 'Notes',
  summary: 'Public summary',
  renderedHtml: '<p data-block-id="p-1">Private body</p>',
  plainText: 'Private body',
  document: { type: 'doc', content: [] },
  entryId: 'private-entry-id',
  publishedAt: new Date('2026-08-27T00:00:00.000Z'),
}

describe('public content projection', () => {
  it('returns the sanitized body for Full exposure without private fields', () => {
    const projection = projectPublishedVersion({ ...baseVersion, exposure: 'full' })

    expect(projection).toEqual({
      type: 'blog',
      slug: 'first-light',
      title: 'First Light',
      subtitle: null,
      categoryLabel: 'Notes',
      summary: 'Public summary',
      exposure: 'full',
      bodyHtml: '<p data-block-id="p-1">Private body</p>',
      publishedAt: '2026-08-27T00:00:00.000Z',
    })
    expect(projection).not.toHaveProperty('document')
    expect(projection).not.toHaveProperty('plainText')
    expect(projection).not.toHaveProperty('entryId')
  })

  it('returns only the owner summary for Summary exposure', () => {
    expect(projectPublishedVersion({ ...baseVersion, exposure: 'summary' })).toEqual(
      expect.objectContaining({
        exposure: 'summary',
        summary: 'Public summary',
        bodyHtml: null,
      }),
    )
  })

  it('returns no guest DTO for Hidden exposure', () => {
    expect(projectPublishedVersion({ ...baseVersion, exposure: 'hidden' })).toBeNull()
  })
})
