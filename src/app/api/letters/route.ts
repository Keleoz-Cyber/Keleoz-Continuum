import { createHmac } from 'node:crypto'

import { headers } from 'next/headers'

import { serverEnv } from '@/shared/env'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { letterSubmissionSchema } from '@/modules/letters/contracts'
import { LetterRateLimitError } from '@/modules/letters/repository'
import { lettersRepository } from '@/modules/letters/runtime'

export const runtime = 'nodejs'

function sourceHash(address: string): string {
  return createHmac('sha256', serverEnv.SESSION_SECRET).update(address).digest('hex')
}

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request, serverEnv.SITE_ORIGIN)) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = letterSubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: '信件内容不符合要求。' }, { status: 400 })
  }

  const requestHeaders = await headers()
  const address =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    requestHeaders.get('x-real-ip') ||
    'unknown'

  try {
    const letter = await lettersRepository.submit({
      ...parsed.data,
      sourceHash: sourceHash(address),
    })
    return Response.json(
      { ok: true, postalCode: letter.postalCode },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof LetterRateLimitError) {
      return Response.json({ error: '今天寄出的信已经够多了，请稍后再来。' }, { status: 429 })
    }
    return Response.json({ error: '信件暂时没有寄出，请稍后重试。' }, { status: 500 })
  }
}
