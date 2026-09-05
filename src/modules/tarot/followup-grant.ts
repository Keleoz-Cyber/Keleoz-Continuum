import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

type Input = Record<string, unknown> & { followupGrant?: unknown; question?: unknown }
function fingerprint(input: Input) {
  const bound = { ...input }
  delete bound.followupGrant
  delete bound.question
  delete bound.mode
  return createHash('sha256').update(JSON.stringify(bound)).digest('hex')
}
export function createTarotFollowupGrantManager(secret: string) {
  const grants = new Map<string, { expiresAt: number; fingerprint: string }>()
  return {
    issue(input: Input, now: Date) {
      for (const [token, grant] of grants) if (grant.expiresAt < now.getTime()) grants.delete(token)
      const expiresAt = now.getTime() + 10 * 60_000
      const nonce = randomBytes(16).toString('hex')
      const bound = fingerprint(input)
      const signature = createHmac('sha256', secret).update(`${expiresAt}\0${nonce}\0${bound}`).digest('hex')
      const token = `${expiresAt}.${nonce}.${signature}`
      grants.set(token, { expiresAt, fingerprint: bound })
      return token
    },
    claim(input: Input, now: Date) {
      const token = typeof input.followupGrant === 'string' ? input.followupGrant : ''
      const grant = grants.get(token)
      if (!grant) return null
      if (grant.expiresAt < now.getTime()) {grants.delete(token);return null}
      const expected = Buffer.from(grant.fingerprint, 'hex')
      const actual = Buffer.from(fingerprint(input), 'hex')
      if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null
      grants.delete(token)
      let restored=false
      return (at:Date)=>{if(!restored&&at.getTime()<=grant.expiresAt){restored=true;grants.set(token,grant)}}
    },
    consume(input: Input,now:Date){
      return this.claim(input,now)!==null
    },
  }
}
