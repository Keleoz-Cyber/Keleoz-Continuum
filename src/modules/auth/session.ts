export type SessionMaterial = {
  token: string
  tokenHash: string
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createSessionMaterial(): SessionMaterial {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashSessionToken(token)

  return { token, tokenHash }
}
import { createHash, randomBytes } from 'node:crypto'
