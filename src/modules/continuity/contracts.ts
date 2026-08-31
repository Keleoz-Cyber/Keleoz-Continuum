import type { PublicContentListItem } from '@/modules/content/dto'

export type TimelineMonth = { key: string; label: string; items: PublicContentListItem[] }
export type TimelineYear = { year: number; months: TimelineMonth[] }
export type PublicSearchResult = PublicContentListItem & { snippet: string }

export function groupTimelineItems(items: PublicContentListItem[]): TimelineYear[] {
  const years: TimelineYear[] = []
  for (const item of items) {
    const date = new Date(item.publishedAt)
    if (Number.isNaN(date.getTime())) continue
    const year = date.getUTCFullYear()
    const monthNumber = date.getUTCMonth() + 1
    const key = `${year}-${String(monthNumber).padStart(2, '0')}`
    let yearGroup = years.find((group) => group.year === year)
    if (!yearGroup) {
      yearGroup = { year, months: [] }
      years.push(yearGroup)
    }
    let month = yearGroup.months.find((group) => group.key === key)
    if (!month) {
      month = {
        key,
        label: new Intl.DateTimeFormat('zh-CN', { month: 'long', timeZone: 'UTC' }).format(date),
        items: [],
      }
      yearGroup.months.push(month)
    }
    month.items.push(item)
  }
  return years
}

export function normalizePublicSearchQuery(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
  if (normalized.length < 2 && !/\p{Script=Han}/u.test(normalized)) return null
  if (normalized.length > 80) throw new Error('Search query must not exceed 80 characters')
  return normalized
}

export function buildPublicSearchSnippet(input: {
  exposure: 'full' | 'summary'
  summary: string
  plainText: string
  query: string
}) {
  if (input.exposure === 'summary') return input.summary.trim()
  const text = input.plainText.replace(/\s+/g, ' ').trim()
  if (!text) return input.summary.trim()
  const index = text.toLocaleLowerCase().indexOf(input.query)
  if (index < 0) return text.slice(0, 180) + (text.length > 180 ? '…' : '')
  const start = Math.max(0, index - 72)
  const end = Math.min(text.length, index + input.query.length + 96)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}
