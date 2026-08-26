import { z } from 'zod'

export const letterSubmissionSchema = z.object({
  senderName: z.string().trim().max(120).optional(),
  content: z.string().trim().min(1, '信件内容不能为空').max(10_000, '信件内容过长'),
  visibility: z.enum(['public', 'private']),
})

export function deriveLetterPostalCode(seed: string): string {
  let hash = 5381
  for (const character of seed) {
    hash = ((hash * 33) ^ character.charCodeAt(0)) >>> 0
  }
  return String(100000 + (hash % 900000))
}
