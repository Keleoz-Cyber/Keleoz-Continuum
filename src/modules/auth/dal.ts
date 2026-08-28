import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SESSION_COOKIE_NAME } from '@/modules/auth/constants'
import { resolveOptionalOwner } from '@/modules/auth/optional'
import { authRepository } from '@/modules/auth/runtime'

export const getCurrentOwner = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  return authRepository.resolveOwnerByToken(token)
})

export const getOptionalCurrentOwner = cache(() => resolveOptionalOwner(getCurrentOwner))

export async function requireOwner(): Promise<{ id: string; username: string }> {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/studio/login')
  return owner
}
