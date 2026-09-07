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

  it('accepts a password of exactly eight characters unchanged', () => {
    expect(parseOwnerBootstrap({
      CONTINUUM_OWNER_USERNAME: 'admin',
      CONTINUUM_OWNER_PASSWORD: 'test1234',
    })).toEqual({ username: 'admin', password: 'test1234' })
  })

  it('rejects passwords shorter than eight characters', () => {
    expect(() =>
      parseOwnerBootstrap({
        CONTINUUM_OWNER_USERNAME: 'keleoz',
        CONTINUUM_OWNER_PASSWORD: 'test123',
      }),
    ).toThrow('at least 8 characters')
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
