import { z } from 'zod'

export type ServerEnv = {
  NODE_ENV: 'development' | 'test' | 'production'
  DATABASE_URL: string
  SESSION_SECRET: string
  SITE_ORIGIN: string
  MEDIA_DRIVER: 'local' | 'lightcos'
  MEDIA_LOCAL_ROOT: string
  MEDIA_LIGHTCOS_BUCKET: string | null
  MEDIA_LIGHTCOS_SECRET_ID: string | null
  MEDIA_LIGHTCOS_SECRET_KEY: string | null
  MEDIA_PUBLIC_ORIGIN: string | null
  AI_GATEWAY_ENABLED: boolean
  AI_BASE_URL: string | null
  AI_API_KEY: string | null
  AI_MODEL: string | null
  AI_COMPANION_NAME: string
  AI_TEA_MAX_OUTPUT_TOKENS: number
  AI_TEA_MAX_REQUESTS_PER_SESSION: number
  AI_TEA_MAX_REQUESTS_PER_SOURCE_DAY: number
  AI_TEA_COOLDOWN_SECONDS: number
  AI_STORY_MAX_OUTPUT_TOKENS: number
  AI_STORY_DOCUMENT_MAX_OUTPUT_TOKENS: number
  AI_STORY_MAX_REQUESTS_PER_SESSION: number
  AI_STORY_MAX_REQUESTS_PER_SOURCE_DAY: number
  AI_STORY_COOLDOWN_SECONDS: number
  AI_STORY_DOCUMENT_TIMEOUT_MS: number
  AI_TAROT_MAX_OUTPUT_TOKENS: number
  AI_TAROT_MAX_REQUESTS_PER_SESSION: number
  AI_TAROT_MAX_REQUESTS_PER_SOURCE_DAY: number
  AI_TAROT_COOLDOWN_SECONDS: number
  AI_PERSONA_MAX_OUTPUT_TOKENS: number
  AI_GLOBAL_MAX_CONCURRENCY: number
  AI_TIMEOUT_MS: number
  AI_DAILY_BUDGET_MICRO_USD: number
  AI_INPUT_MICRO_USD_PER_MILLION_TOKENS: number
  AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS: number
}

function isPostgresUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'postgres:' || protocol === 'postgresql:'
  } catch {
    return false
  }
}

function isHttpOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.pathname === '/'
  } catch {
    return false
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

const databaseUrl = z.string().refine(isPostgresUrl, 'DATABASE_URL must use postgres:// or postgresql://')
const siteOrigin = z.string().refine(isHttpOrigin, 'SITE_ORIGIN must be an HTTP(S) origin without a path')
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value
const optionalString = z.preprocess(
  blankToUndefined,
  z.string().trim().min(1).optional(),
).transform((value) => value ?? null)
const optionalHttpUrl = z.preprocess(
  blankToUndefined,
  z.string().trim().refine(isHttpUrl, 'AI_BASE_URL must use HTTP(S)').optional(),
).transform((value) => value ?? null)
const optionalHttpOrigin = z.preprocess(
  blankToUndefined,
  z.string().trim().refine(isHttpOrigin, 'MEDIA_PUBLIC_ORIGIN must be an HTTP(S) origin without a path').optional(),
).transform((value) => value ?? null)
const integer = (minimum: number, maximum: number, fallback: number) =>
  z.coerce.number().int().min(minimum).max(maximum).default(fallback)

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: databaseUrl,
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must contain at least 32 characters'),
  SITE_ORIGIN: siteOrigin,
  MEDIA_DRIVER: z.enum(['local', 'lightcos']),
  MEDIA_LOCAL_ROOT: z.string().trim().min(1, 'MEDIA_LOCAL_ROOT is required'),
  MEDIA_LIGHTCOS_BUCKET: optionalString,
  MEDIA_LIGHTCOS_SECRET_ID: optionalString,
  MEDIA_LIGHTCOS_SECRET_KEY: optionalString,
  MEDIA_PUBLIC_ORIGIN: optionalHttpOrigin,
  AI_GATEWAY_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  AI_BASE_URL: optionalHttpUrl,
  AI_API_KEY: optionalString,
  AI_MODEL: optionalString,
  AI_COMPANION_NAME: z.string().trim().min(1).max(80).default('Keleoz'),
  AI_TEA_MAX_OUTPUT_TOKENS: integer(64, 2_048, 320),
  AI_TEA_MAX_REQUESTS_PER_SESSION: integer(1, 52, 12),
  AI_TEA_MAX_REQUESTS_PER_SOURCE_DAY: integer(1, 500, 20),
  AI_TEA_COOLDOWN_SECONDS: integer(0, 3_600, 3),
  AI_STORY_MAX_OUTPUT_TOKENS: integer(256, 4_096, 1_200),
  AI_STORY_DOCUMENT_MAX_OUTPUT_TOKENS: integer(1_024, 16_384, 8_192),
  AI_STORY_MAX_REQUESTS_PER_SESSION: integer(1, 64, 20),
  AI_STORY_MAX_REQUESTS_PER_SOURCE_DAY: integer(1, 500, 30),
  AI_STORY_COOLDOWN_SECONDS: integer(0, 3_600, 1),
  AI_STORY_DOCUMENT_TIMEOUT_MS: integer(10_000, 180_000, 90_000),
  AI_TAROT_MAX_OUTPUT_TOKENS: integer(128, 2_048, 600),
  AI_TAROT_MAX_REQUESTS_PER_SESSION: integer(1, 4, 4),
  AI_TAROT_MAX_REQUESTS_PER_SOURCE_DAY: integer(1, 500, 20),
  AI_TAROT_COOLDOWN_SECONDS: integer(0, 3_600, 1),
  AI_PERSONA_MAX_OUTPUT_TOKENS: integer(128, 2_048, 500),
  AI_GLOBAL_MAX_CONCURRENCY: integer(1, 16, 2),
  AI_TIMEOUT_MS: integer(1_000, 120_000, 30_000),
  AI_DAILY_BUDGET_MICRO_USD: integer(0, 2_000_000_000, 0),
  AI_INPUT_MICRO_USD_PER_MILLION_TOKENS: integer(0, 2_000_000_000, 0),
  AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS: integer(0, 2_000_000_000, 0),
}).superRefine((value, context) => {
  if (value.MEDIA_DRIVER === 'lightcos') {
    for (const field of [
      'MEDIA_LIGHTCOS_BUCKET', 'MEDIA_LIGHTCOS_SECRET_ID', 'MEDIA_LIGHTCOS_SECRET_KEY', 'MEDIA_PUBLIC_ORIGIN',
    ] as const) {
      if (!value[field]) context.addIssue({ code: 'custom', path: [field], message: `${field} is required when MEDIA_DRIVER=lightcos` })
    }
    if (value.MEDIA_LIGHTCOS_BUCKET && !/^[a-z0-9][a-z0-9-]{1,62}-\d{5,}$/.test(value.MEDIA_LIGHTCOS_BUCKET)) {
      context.addIssue({ code: 'custom', path: ['MEDIA_LIGHTCOS_BUCKET'], message: 'MEDIA_LIGHTCOS_BUCKET must include the APPID suffix' })
    }
  }
  if (!value.AI_GATEWAY_ENABLED) return
  for (const field of ['AI_BASE_URL', 'AI_API_KEY', 'AI_MODEL'] as const) {
    if (!value[field]) context.addIssue({ code: 'custom', path: [field], message: `${field} is required when AI is enabled` })
  }
  for (const field of [
    'AI_DAILY_BUDGET_MICRO_USD',
    'AI_INPUT_MICRO_USD_PER_MILLION_TOKENS',
    'AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS',
  ] as const) {
    if (value[field] <= 0) context.addIssue({ code: 'custom', path: [field], message: `${field} must be positive when AI is enabled` })
  }
})

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(source)
}
