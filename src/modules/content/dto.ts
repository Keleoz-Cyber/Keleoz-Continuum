export type PublicContentDto = {
  type: 'blog' | 'project' | 'moment' | 'page'
  slug: string
  title: string
  subtitle: string | null
  categoryLabel: string | null
  summary: string
  exposure: 'full' | 'summary'
  bodyHtml: string | null
  publishedAt: string
}

export type PublicContentListItem = Omit<PublicContentDto, 'bodyHtml'>

export type PublishedVersionProjectionSource = {
  type: PublicContentDto['type']
  slug: string
  title: string
  subtitle: string | null
  categoryLabel: string | null
  summary: string
  exposure: 'full' | 'summary' | 'hidden'
  renderedHtml: string
  publishedAt: Date
  document?: unknown
  plainText?: string
  entryId?: string
}
