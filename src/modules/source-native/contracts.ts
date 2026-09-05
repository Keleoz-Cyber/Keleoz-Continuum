import { z } from 'zod'

export const sourceStore = z.enum(['apiConfigs', 'apiSettings', 'chatMessages', 'chatThreads', 'chatSummaries', 'groups', 'memories', 'autoMemory', 'categories', 'about', 'uploadedFiles', 'blogAnnotations', 'blogComments'])
export const sourceWrite = z.object({
  op: z.enum(['put', 'delete']), store: sourceStore,
  key: z.string().min(1).max(180),
  value: z.record(z.string(), z.unknown()).optional(),
})

export function withoutProviderSecrets(value: Record<string, unknown>): Record<string, unknown> {
  const clean = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(clean)
    if (!item || typeof item !== 'object') return item
    return Object.fromEntries(Object.entries(item).filter(([key]) => !/^(api_?key|key|token|accessToken|secret|password|baseUrl|endpoint|url)$/i.test(key)).map(([key, entry]) => [key, clean(entry)]))
  }
  return clean(value) as Record<string, unknown>
}
