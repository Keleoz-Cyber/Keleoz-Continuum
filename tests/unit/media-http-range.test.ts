import { describe, expect, it } from 'vitest'

import { parseMediaByteRange } from '@/modules/media/http-range'

describe('media HTTP range', () => {
  it('parses bounded, open-ended, and suffix ranges', () => {
    expect(parseMediaByteRange('bytes=10-19', 100)).toEqual({ start: 10, end: 19 })
    expect(parseMediaByteRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 })
    expect(parseMediaByteRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 })
  })

  it('rejects multiple or unsatisfiable ranges', () => {
    expect(() => parseMediaByteRange('bytes=0-1,5-6', 100)).toThrow('range')
    expect(() => parseMediaByteRange('bytes=100-120', 100)).toThrow('range')
  })
})
