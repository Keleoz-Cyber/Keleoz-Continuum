import { z } from 'zod'

const teaSourcePostSchema = z.object({
  id: z.string().regex(/^tea_\d+$/),
  title: z.string().trim().min(1).max(240),
  subtitle: z.string().trim().max(320),
  locked: z.literal(true),
  category: z.string().max(120).optional(),
  content: z.string().min(1).max(60_000),
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
})

export function normalizeTeaSourcePost(value: unknown) {
  const parsed = teaSourcePostSchema.safeParse(value)
  if (!parsed.success) return null
  return {
    id: `tea-history:${parsed.data.id}`,
    type: 'tea-history' as const,
    version: 1 as const,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    content: parsed.data.content,
    createdAt: parsed.data.created,
    updatedAt: parsed.data.updated,
  }
}
