import { z } from 'zod'

const storySourcePostSchema = z.object({
  id: z.string().regex(/^post_\d+$/),
  title: z.string().trim().min(1).max(240),
  subtitle: z.string().trim().max(320),
  locked: z.literal(true),
  category: z.string().max(120).optional(),
  content: z.string().min(1).max(120_000),
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
})

function storyStage(title: string, subtitle: string) {
  if (title.startsWith('📖 Story 进度')) return 'progress' as const
  if (title.startsWith('📜 Story Design')) {
    return subtitle.startsWith('设定文档生成中') ? 'generating' as const : 'document' as const
  }
  if (title.startsWith('Interactive Story -')) return 'raw' as const
  return null
}

export function normalizeStorySourcePost(value: unknown) {
  const parsed = storySourcePostSchema.safeParse(value)
  if (!parsed.success) return null
  const stage = storyStage(parsed.data.title, parsed.data.subtitle)
  if (!stage) return null
  return {
    id: `story-history:${parsed.data.id}`,
    type: 'story-history' as const,
    version: 1 as const,
    stage,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    content: parsed.data.content,
    createdAt: parsed.data.created,
    updatedAt: parsed.data.updated,
  }
}
