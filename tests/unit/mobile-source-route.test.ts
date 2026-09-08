import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { GET } from '@/app/reference/internal-beyond-mobile/[...path]/route'

const url = 'https://keleoz.com/reference/internal-beyond-mobile/index.html?continuum-local=1'
const params = { params: Promise.resolve({ path: ['index.html'] }) }

it('revalidates the public mobile shell and permits bounded edge caching', async () => {
  const first = await GET(new Request(url), params)
  expect(first.status).toBe(200)
  expect(first.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=300, must-revalidate')
  const tag = first.headers.get('etag')
  expect(tag).toMatch(/^"[a-f0-9]{64}"$/)
  const same = await GET(new Request(url, { headers: { 'if-none-match': 'W/' + tag } }), params)
  expect(same.status).toBe(304)
  expect(await same.text()).toBe('')
  const stale = await GET(new Request(url, { headers: { 'if-none-match': '"old-release"' } }), params)
  expect(stale.status).toBe(200)
  expect(stale.headers.get('etag')).toBe(tag)
  const withCookie = await GET(new Request(url, { headers: { cookie: 'session=untrusted' } }), params)
  expect(withCookie.headers.get('etag')).toBe(tag)
  expect(withCookie.headers.get('set-cookie')).toBeNull()
})

it('keeps raw mobile bytes immutable and unadapted', async () => {
  const raw = await GET(new Request(url.split('?')[0]), params)
  expect(createHash('sha256').update(new Uint8Array(await raw.arrayBuffer())).digest('hex')).toBe('b343cc08ac8e27905ca61c61f0f065b5f3e25d066c29fce215e88ce064be531d')
  expect(raw.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
})
