'use server'

import { randomInt } from 'node:crypto'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { SESSION_COOKIE_NAME } from '@/modules/auth/constants'
import { authRepository } from '@/modules/auth/runtime'
import { authenticateOwner } from '@/modules/auth/service'
import { serverEnv } from '@/shared/env'

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
})

export type LoginState = {
  error: string | null
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const startedAt = Date.now()
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    await delay(450 + randomInt(0, 151))
    return { error: '用户名或密码不正确。' }
  }

  const requestHeaders = await headers()
  const clientAddress =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    requestHeaders.get('x-real-ip') ||
    'unknown'
  const result = await authenticateOwner(authRepository, {
    ...parsed.data,
    clientAddress,
    fingerprintSecret: serverEnv.SESSION_SECRET,
  })

  if (!result.ok) {
    const minimumDuration = 450 + randomInt(0, 151)
    await delay(Math.max(0, minimumDuration - (Date.now() - startedAt)))
    return {
      error:
        result.reason === 'blocked'
          ? '登录暂时受限，请稍后再试。'
          : '用户名或密码不正确。',
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: serverEnv.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: result.expiresAt,
  })
  const next = String(formData.get('next') ?? '')
  redirect(['/chat', '/memory'].includes(next) ? next : '/studio')
}

export async function logoutAction(): Promise<never> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (token) {
    await authRepository.deleteSessionByToken(token)
  }
  cookieStore.delete(SESSION_COOKIE_NAME)
  redirect('/studio/login')
}
