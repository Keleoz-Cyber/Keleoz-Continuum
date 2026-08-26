import type { PublicContentDto, PublishedVersionProjectionSource } from '@/modules/content/dto'

export function projectPublishedVersion(
  version: PublishedVersionProjectionSource,
): PublicContentDto | null {
  if (version.exposure === 'hidden') {
    return null
  }

  return {
    type: version.type,
    slug: version.slug,
    title: version.title,
    subtitle: version.subtitle,
    categoryLabel: version.categoryLabel,
    summary: version.summary,
    exposure: version.exposure,
    bodyHtml: version.exposure === 'full' ? version.renderedHtml : null,
    publishedAt: version.publishedAt.toISOString(),
  }
}
