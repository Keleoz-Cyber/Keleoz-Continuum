import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { GET } from '@/app/reference/internal-beyond/[...path]/route'

const sourceHash = '92F8255E6B710FEA150F3F08BC51737442C6CC2F707C3DCB4A64C4AC1FBE8D28'

async function requestSource(url: string, path: string[]) {
  return GET(new Request(url), { params: Promise.resolve({ path }) })
}

describe('Desktop source route', () => {
  it('keeps the raw immutable snapshot byte-identical', async () => {
    const response = await requestSource(
      'http://continuum.test/reference/internal-beyond/InternalBeyond.html',
      ['InternalBeyond.html'],
    )
    const body = new Uint8Array(await response.arrayBuffer())

    expect(response.status).toBe(200)
    expect(createHash('sha256').update(body).digest('hex').toUpperCase()).toBe(sourceHash)
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('x-content-adapter')).toBeNull()
  })

  it('versions and revalidates the public Home adapter response', async () => {
    const response = await requestSource(
      'http://continuum.test/reference/internal-beyond/InternalBeyond.html?continuum-gloss=2',
      ['InternalBeyond.html'],
    )
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-cache')
    expect(response.headers.get('x-content-adapter')).toBe('Continuum source gloss fallback v2')
    expect(body).toContain('__continuumSourceGlossFallback')
  })

  it('rejects traversal outside the immutable snapshot', async () => {
    const response = await requestSource(
      'http://continuum.test/reference/internal-beyond/../package.json',
      ['..', 'package.json'],
    )

    expect(response.status).toBe(404)
  })
})
