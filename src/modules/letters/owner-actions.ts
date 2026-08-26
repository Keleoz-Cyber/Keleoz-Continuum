'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireOwner } from '@/modules/auth/dal'
import { lettersRepository } from '@/modules/letters/runtime'

const reviewSchema = z.object({
  id: z.uuid(),
  status: z.enum(['approved', 'rejected']),
  ownerReply: z.string().trim().max(10_000),
})

export async function reviewLetterAction(formData: FormData): Promise<void> {
  await requireOwner()
  const input = reviewSchema.parse({
    id: formData.get('id'),
    status: formData.get('status'),
    ownerReply: formData.get('ownerReply') ?? '',
  })
  await lettersRepository.review(input)
  revalidatePath('/letters')
  revalidatePath('/studio')
}
