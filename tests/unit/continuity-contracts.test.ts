import { describe, expect, it } from 'vitest'

import {
  buildPublicSearchSnippet,
  groupTimelineItems,
  normalizePublicSearchQuery,
} from '@/modules/continuity/contracts'
import type { PublicContentListItem } from '@/modules/content/dto'

function item(slug: string, publishedAt: string, type: PublicContentListItem['type'] = 'blog'): PublicContentListItem {
  return { type, slug, title: slug, subtitle: null, categoryLabel: null, summary: `${slug} summary`, exposure: 'full', publishedAt }
}

describe('public continuity contracts', () => {
  it('groups an already-descending timeline by year and month without changing item order', () => {
    const groups = groupTimelineItems([
      item('new-year', '2026-01-02T00:00:00.000Z', 'moment'),
      item('year-end', '2025-12-30T00:00:00.000Z', 'project'),
      item('winter', '2025-12-01T00:00:00.000Z'),
      item('autumn', '2025-10-05T00:00:00.000Z'),
    ])

    expect(groups.map((group) => group.year)).toEqual([2026, 2025])
    expect(groups[1]?.months.map((month) => month.key)).toEqual(['2025-12', '2025-10'])
    expect(groups[1]?.months[0]?.items.map((entry) => entry.slug)).toEqual(['year-end', 'winter'])
  })

  it('normalizes useful search text, allows one Han character, and rejects broad one-letter queries', () => {
    expect(normalizePublicSearchQuery('  Keleoz   Continuum  ')).toBe('keleoz continuum')
    expect(normalizePublicSearchQuery(' 雾 ')).toBe('雾')
    expect(normalizePublicSearchQuery(' a ')).toBeNull()
    expect(normalizePublicSearchQuery('   ')).toBeNull()
    expect(() => normalizePublicSearchQuery('x'.repeat(81))).toThrow(/80/)
  })

  it('never derives a Summary result snippet from its private body', () => {
    expect(buildPublicSearchSnippet({ exposure: 'summary', summary: 'Only this is public.', plainText: 'private needle', query: 'needle' })).toBe('Only this is public.')
    expect(buildPublicSearchSnippet({ exposure: 'full', summary: '', plainText: 'Before the needle and after it.', query: 'needle' })).toContain('needle')
  })
})
