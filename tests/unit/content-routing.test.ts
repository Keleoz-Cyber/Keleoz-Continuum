import { describe, expect, it } from 'vitest'

import {
  CONTENT_TYPE_CONFIG,
  contentPublicPath,
  draftSlugForType,
  parseContentType,
  studioContentPath,
} from '@/modules/content/routing'

describe('typed public content routing', () => {
  it('defines stable public and Studio destinations for every content type', () => {
    expect(CONTENT_TYPE_CONFIG).toEqual({
      blog: { singular: 'Blog', plural: 'Blog', publicRoot: '/blog', studioLabel: 'Blog' },
      project: { singular: 'Project', plural: 'Projects', publicRoot: '/projects', studioLabel: 'Project' },
      moment: { singular: 'Moment', plural: 'Moments', publicRoot: '/moments', studioLabel: 'Moment' },
      page: { singular: 'Page', plural: 'Pages', publicRoot: '/pages', studioLabel: 'Page' },
    })

    expect(contentPublicPath('blog', 'first-light')).toBe('/blog/first-light')
    expect(contentPublicPath('project', 'continuum')).toBe('/projects/continuum')
    expect(contentPublicPath('moment', 'rain-at-dawn')).toBe('/moments/rain-at-dawn')
    expect(contentPublicPath('page', 'about')).toBe('/about')
    expect(contentPublicPath('page', 'credits')).toBe('/pages/credits')
    expect(studioContentPath('entry-id')).toBe('/studio/content/entry-id')
    expect(draftSlugForType('page', 'About', 'abcd1234')).toBe('about')
    expect(draftSlugForType('project', 'Keleoz Continuum', 'abcd1234')).toBe('keleoz-continuum-abcd1234')
  })

  it('accepts only the four persisted content types', () => {
    expect(parseContentType('project')).toBe('project')
    expect(parseContentType('moment')).toBe('moment')
    expect(parseContentType('page')).toBe('page')
    expect(() => parseContentType('letter')).toThrow(/content type/i)
    expect(() => parseContentType(null)).toThrow(/content type/i)
  })
})
