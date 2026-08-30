import { z } from 'zod'

const schema = z.object({
  id: z.string().regex(/^tarot_\d+$/), title: z.string().trim().startsWith('Tarot · ').max(240),
  subtitle: z.string().trim().max(320), locked: z.literal(true), category: z.string().max(120).optional(),
  content: z.string().min(1).max(80_000), created: z.number().int().nonnegative(), updated: z.number().int().nonnegative(),
})
export function normalizeTarotSourcePost(value: unknown) {
  const parsed = schema.safeParse(value)
  if (!parsed.success) return null
  return {
    id: `tarot-history:${parsed.data.id}`, type: 'tarot-history' as const, version: 1 as const,
    title: parsed.data.title, subtitle: parsed.data.subtitle, content: parsed.data.content,
    createdAt: parsed.data.created, updatedAt: parsed.data.updated,
  }
}
