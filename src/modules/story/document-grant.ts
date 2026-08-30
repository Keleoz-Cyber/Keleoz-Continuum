import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

type GrantInput = Record<string, unknown> & { documentGrant?: unknown }

function fingerprint(input: GrantInput) {
  const bound = { ...input }
  delete bound.documentGrant
  return createHash('sha256').update(JSON.stringify(bound)).digest('hex')
}

export function createStoryDocumentGrantManager(secret: string) {
  const grants = new Map<string, { expiresAt: number; fingerprint: string }>()

  function prune(nowMs: number) {
    for (const [token, grant] of grants) {
      if (grant.expiresAt < nowMs) grants.delete(token)
    }
  }

  return {
    issue(input: GrantInput, now: Date) {
      prune(now.getTime())
      const expiresAt = now.getTime() + 5 * 60_000
      const nonce = randomBytes(16).toString('hex')
      const boundFingerprint = fingerprint(input)
      const signature = createHmac('sha256', secret)
        .update(`${expiresAt}\0${nonce}\0${boundFingerprint}`)
        .digest('hex')
      const token = `${expiresAt}.${nonce}.${signature}`
      grants.set(token, { expiresAt, fingerprint: boundFingerprint })
      return token
    },
    consume(input: GrantInput, now: Date) {
      const token = typeof input.documentGrant === 'string' ? input.documentGrant : ''
      const grant = grants.get(token)
      if (!grant) return false
      grants.delete(token)
      if (grant.expiresAt < now.getTime()) return false
      const expected = Buffer.from(grant.fingerprint, 'hex')
      const actual = Buffer.from(fingerprint(input), 'hex')
      return expected.length === actual.length && timingSafeEqual(expected, actual)
    },
  }
}
