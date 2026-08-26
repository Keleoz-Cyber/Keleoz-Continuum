export class PublishedSlugChangeError extends Error {
  constructor() {
    super('A published slug cannot be changed without an explicit redirect migration')
    this.name = 'PublishedSlugChangeError'
  }
}

export function normalizeSlug(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)

  if (!slug) {
    throw new Error('A non-empty slug is required')
  }

  return slug
}

export function resolveStableSlug(input: {
  currentSlug: string
  requestedSlug: string
  hasPublication: boolean
}): string {
  const currentSlug = normalizeSlug(input.currentSlug)
  const requestedSlug = normalizeSlug(input.requestedSlug)

  if (input.hasPublication && currentSlug !== requestedSlug) {
    throw new PublishedSlugChangeError()
  }

  return input.hasPublication ? currentSlug : requestedSlug
}
