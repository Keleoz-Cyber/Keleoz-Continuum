import { describe, expect, it } from 'vitest'

import { parseOwnerBootstrap } from '@/modules/auth/bootstrap'

describe('owner bootstrap input', () => {
  it('normalizes the username and accepts a strong password', () => {
    expect(
      parseOwnerBootstrap({
        CONTINUUM_OWNER_USERNAME: '  Keleoz  ',
        CONTINUUM_OWNER_PASSWORD: 'a-strong-owner-password',
      }),
    ).toEqual({ username: 'keleoz', password: 'a-strong-owner-password' })
  })

  it('rejects passwords shorter than fourteen characters', () => {
    expect(() =>
      parseOwnerBootstrap({
        CONTINUUM_OWNER_USERNAME: 'keleoz',
        CONTINUUM_OWNER_PASSWORD: 'too-short',
      }),
    ).toThrow('14')
  })

  it('rejects a blank owner username', () => {
    expect(() =>
      parseOwnerBootstrap({
        CONTINUUM_OWNER_USERNAME: '   ',
        CONTINUUM_OWNER_PASSWORD: 'a-strong-owner-password',
      }),
    ).toThrow('username')
  })
})
