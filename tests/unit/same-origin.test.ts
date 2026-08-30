import { describe, expect, it } from 'vitest'

import { getTrustedProxyClientAddress, hasAllowedOrigin } from '@/shared/same-origin'

describe('same-origin and proxy boundary', () => {
  it('requires the exact browser Origin for public mutation and AI requests', () => {
    expect(hasAllowedOrigin(new Request('http://continuum.test', {
      headers: { origin: 'http://continuum.test' },
    }), 'http://continuum.test')).toBe(true)
    expect(hasAllowedOrigin(new Request('http://continuum.test'), 'http://continuum.test')).toBe(false)
  })

  it('trusts only the reverse-proxy-overwritten real IP header and ignores spoofable forwarding chains', () => {
    expect(getTrustedProxyClientAddress(new Headers({
      'x-real-ip': '203.0.113.9',
      'x-forwarded-for': '198.51.100.5, 203.0.113.9',
    }))).toBe('203.0.113.9')
    expect(getTrustedProxyClientAddress(new Headers({ 'x-forwarded-for': '198.51.100.5' }))).toBe('unknown')
  })
})
