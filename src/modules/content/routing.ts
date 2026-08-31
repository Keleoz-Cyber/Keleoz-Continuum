import type { PublicContentDto } from './dto'
import { normalizeSlug } from './slug'

export type ContentType = PublicContentDto['type']

export const CONTENT_TYPE_CONFIG: Record<ContentType, {
  singular: string
  plural: string
  publicRoot: string
  studioLabel: string
}> = {
  blog: { singular: 'Blog', plural: 'Blog', publicRoot: '/blog', studioLabel: 'Blog' },
  project: { singular: 'Project', plural: 'Projects', publicRoot: '/projects', studioLabel: 'Project' },
  moment: { singular: 'Moment', plural: 'Moments', publicRoot: '/moments', studioLabel: 'Moment' },
  page: { singular: 'Page', plural: 'Pages', publicRoot: '/pages', studioLabel: 'Page' },
}

export function parseContentType(value: FormDataEntryValue | null): ContentType {
  if (typeof value === 'string' && value in CONTENT_TYPE_CONFIG) return value as ContentType
  throw new Error('Invalid content type')
}

export function contentPublicPath(type: ContentType, slug: string) {
  if (type === 'page' && slug === 'about') return '/about'
  return `${CONTENT_TYPE_CONFIG[type].publicRoot}/${slug}`
}

export function studioContentPath(entryId: string) {
  return `/studio/content/${entryId}`
}

export function draftSlugForType(type: ContentType, title: string, token: string) {
  const normalized = normalizeSlug(title)
  if (type === 'page' && normalized === 'about') return 'about'
  return `${normalized}-${token}`
}
