'use client'

import { useActionState } from 'react'

import { loginAction, type LoginState } from '@/modules/auth/actions'

const initialState: LoginState = { error: null }

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState)

  return (
    <form action={action} className="studio-login-form">
      <input type="hidden" name="next" value={returnTo ?? '/studio'} />
      <label>
        <span>Username</span>
        <input autoComplete="username" name="username" required />
      </label>
      <label>
        <span>Password</span>
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      <p aria-live="polite" className="studio-form-error">
        {state.error}
      </p>
      <button disabled={pending} type="submit">
        {pending ? 'Entering…' : 'Enter Studio'}
      </button>
    </form>
  )
}
