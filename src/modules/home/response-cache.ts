import { createHash } from 'node:crypto'

export function publicSourceResponse(body: string | Uint8Array<ArrayBuffer>, request: Request, headers: Record<string, string>): Response {
  const etag = '"' + createHash('sha256').update(body).digest('hex') + '"'
  const candidates = (request.headers.get('if-none-match') || '').split(',').map(value => value.trim().replace(/^W\//, ''))
  const unchanged = candidates.includes(etag) || candidates.includes('*')
  return new Response(unchanged ? null : body, { status: unchanged ? 304 : 200, headers: { ...headers, etag } })
}
