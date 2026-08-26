import { describe, expect, it } from 'vitest'

import { parseServerEnv } from '@/shared/env-schema'

const validEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://continuum:continuum@127.0.0.1:55432/continuum',
  SESSION_SECRET: '0123456789abcdef0123456789abcdef',
  SITE_ORIGIN: 'http://127.0.0.1:3000',
  MEDIA_DRIVER: 'local',
  MEDIA_LOCAL_ROOT: './var/media',
} satisfies NodeJS.ProcessEnv

describe('parseServerEnv', () => {
  it('rejects a short session secret', () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://continuum:continuum@127.0.0.1:55432/continuum',
        SESSION_SECRET: 'short',
        SITE_ORIGIN: 'http://127.0.0.1:3000',
        MEDIA_DRIVER: 'local',
        MEDIA_LOCAL_ROOT: './var/media',
      }),
    ).toThrow('SESSION_SECRET')
  })

  it.each([
    ['NODE_ENV', { ...validEnv, NODE_ENV: 'staging' }],
    ['DATABASE_URL', { ...validEnv, DATABASE_URL: 'not-a-url' }],
    ['SITE_ORIGIN', { ...validEnv, SITE_ORIGIN: '/relative' }],
    ['MEDIA_DRIVER', { ...validEnv, MEDIA_DRIVER: 's3' }],
    ['MEDIA_LOCAL_ROOT', { ...validEnv, MEDIA_LOCAL_ROOT: '' }],
  ])('rejects invalid %s', (field, source) => {
    expect(() => parseServerEnv(source)).toThrow(field)
  })

  it('returns a typed copy of a valid environment', () => {
    expect(parseServerEnv(validEnv)).toEqual(validEnv)
  })
})
