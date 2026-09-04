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
    expect(parseServerEnv(validEnv)).toMatchObject({
      ...validEnv,
      AI_GATEWAY_ENABLED: false,
      AI_TEA_MAX_OUTPUT_TOKENS: 320,
      AI_TEA_MAX_REQUESTS_PER_SESSION: 12,
      AI_TEA_MAX_REQUESTS_PER_SOURCE_DAY: 20,
      AI_TEA_COOLDOWN_SECONDS: 3,
      AI_STORY_MAX_OUTPUT_TOKENS: 1_200,
      AI_STORY_DOCUMENT_MAX_OUTPUT_TOKENS: 8_192,
      AI_STORY_MAX_REQUESTS_PER_SESSION: 20,
      AI_STORY_MAX_REQUESTS_PER_SOURCE_DAY: 30,
      AI_STORY_COOLDOWN_SECONDS: 1,
      AI_STORY_DOCUMENT_TIMEOUT_MS: 90_000,
      AI_TAROT_MAX_OUTPUT_TOKENS: 600,
      AI_TAROT_MAX_REQUESTS_PER_SESSION: 4,
      AI_TAROT_MAX_REQUESTS_PER_SOURCE_DAY: 20,
      AI_TAROT_COOLDOWN_SECONDS: 1,
      AI_PERSONA_MAX_OUTPUT_TOKENS: 500,
      AI_GLOBAL_MAX_CONCURRENCY: 2,
      AI_TIMEOUT_MS: 30_000,
      MEDIA_LIGHTCOS_BUCKET: null,
      MEDIA_LIGHTCOS_SECRET_ID: null,
      MEDIA_LIGHTCOS_SECRET_KEY: null,
      MEDIA_PUBLIC_ORIGIN: null,
    })
  })

  it('normalizes blank optional provider fields from Compose env files to null', () => {
    expect(parseServerEnv({
      ...validEnv,
      MEDIA_LIGHTCOS_BUCKET: '',
      MEDIA_LIGHTCOS_SECRET_ID: '   ',
      MEDIA_LIGHTCOS_SECRET_KEY: '',
      MEDIA_PUBLIC_ORIGIN: '',
      AI_BASE_URL: '',
      AI_API_KEY: '  ',
      AI_MODEL: '',
    })).toMatchObject({
      MEDIA_LIGHTCOS_BUCKET: null,
      MEDIA_LIGHTCOS_SECRET_ID: null,
      MEDIA_LIGHTCOS_SECRET_KEY: null,
      MEDIA_PUBLIC_ORIGIN: null,
      AI_BASE_URL: null,
      AI_API_KEY: null,
      AI_MODEL: null,
    })
  })

  it('requires a complete server-held provider configuration when AI is enabled', () => {
    expect(() => parseServerEnv({ ...validEnv, AI_GATEWAY_ENABLED: 'true' })).toThrow('AI_API_KEY')

    expect(parseServerEnv({
      ...validEnv,
      AI_GATEWAY_ENABLED: 'true',
      AI_BASE_URL: 'https://provider.example/v1',
      AI_API_KEY: 'server-secret',
      AI_MODEL: 'model-id',
      AI_DAILY_BUDGET_MICRO_USD: '100000',
      AI_INPUT_MICRO_USD_PER_MILLION_TOKENS: '200000',
      AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS: '800000',
    })).toMatchObject({
      AI_GATEWAY_ENABLED: true,
      AI_BASE_URL: 'https://provider.example/v1',
      AI_API_KEY: 'server-secret',
      AI_MODEL: 'model-id',
      AI_DAILY_BUDGET_MICRO_USD: 100_000,
    })
  })

  it('requires complete server-held LightCOS configuration only for the LightCOS driver', () => {
    expect(() => parseServerEnv({ ...validEnv, MEDIA_DRIVER: 'lightcos' })).toThrow('MEDIA_LIGHTCOS_BUCKET')

    expect(parseServerEnv({
      ...validEnv,
      MEDIA_DRIVER: 'lightcos',
      MEDIA_LIGHTCOS_BUCKET: 'continuum-1250000000',
      MEDIA_LIGHTCOS_SECRET_ID: 'server-secret-id',
      MEDIA_LIGHTCOS_SECRET_KEY: 'server-secret-key',
      MEDIA_PUBLIC_ORIGIN: 'https://media.example.com',
    })).toMatchObject({
      MEDIA_DRIVER: 'lightcos',
      MEDIA_LIGHTCOS_BUCKET: 'continuum-1250000000',
      MEDIA_PUBLIC_ORIGIN: 'https://media.example.com',
    })
  })
})
