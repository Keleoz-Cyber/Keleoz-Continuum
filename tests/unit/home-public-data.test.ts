import { describe, expect, it, vi } from 'vitest'

import { loadHomePublicData } from '@/modules/home/public-home-data'
import type { PublicContentListItem } from '@/modules/content/dto'

describe('Home public data degradation', () => {
  it('keeps the source Scene available when one or more public projections fail', async () => {
    const list = vi.fn(async (type: 'blog' | 'project' | 'moment' | 'page') => {
      if (type === 'project') throw new Error('database unavailable')
      return [{
        type,
        slug: `${type}-one`,
        title: `${type} one`,
        subtitle: null,
        categoryLabel: null,
        summary: '',
        exposure: 'full',
        publishedAt: '2026-01-01T00:00:00.000Z',
      } satisfies PublicContentListItem]
    })
    const timeline = vi.fn(async () => { throw new Error('database unavailable') })
    const detail = vi.fn(async () => null)

    const result = await loadHomePublicData({ list, timeline, detail })

    expect(result.projects).toEqual([])
    expect(result.blogs).toEqual([expect.objectContaining({ type: 'blog', slug: 'blog-one' })])
    expect(result.moments).toEqual([expect.objectContaining({ type: 'moment', slug: 'moment-one' })])
    expect(result.timeline).toEqual([])
    expect(result.about).toBeNull()
    expect(list).toHaveBeenCalledTimes(3)
  })
})
