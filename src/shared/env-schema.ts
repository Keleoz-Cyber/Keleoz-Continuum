import { z } from 'zod'

export type ServerEnv = {
  NODE_ENV: 'development' | 'test' | 'production'
  DATABASE_URL: string
  SESSION_SECRET: string
  SITE_ORIGIN: string
  MEDIA_DRIVER: 'local' | 'lightcos'
  MEDIA_LOCAL_ROOT: string
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

const databaseUrl = z.string().refine(isPostgresUrl, 'DATABASE_URL must use postgres:// or postgresql://')
const siteOrigin = z.string().refine(isHttpOrigin, 'SITE_ORIGIN must be an HTTP(S) origin without a path')

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: databaseUrl,
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must contain at least 32 characters'),
  SITE_ORIGIN: siteOrigin,
  MEDIA_DRIVER: z.enum(['local', 'lightcos']),
  MEDIA_LOCAL_ROOT: z.string().trim().min(1, 'MEDIA_LOCAL_ROOT is required'),
})

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(source)
}
