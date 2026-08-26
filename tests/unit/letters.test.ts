import { describe, expect, it } from 'vitest'

import { deriveLetterPostalCode, letterSubmissionSchema } from '@/modules/letters/contracts'

describe('Letters submission contract', () => {
  it('normalizes an optional signature and preserves the letter body', () => {
    expect(
      letterSubmissionSchema.parse({
        senderName: '  Keleoz  ',
        content: '  A quiet note from the other side of the window.  ',
        visibility: 'public',
      }),
    ).toEqual({
      senderName: 'Keleoz',
      content: 'A quiet note from the other side of the window.',
      visibility: 'public',
    })
  })

  it('rejects an empty body and unsupported visibility', () => {
    expect(() => letterSubmissionSchema.parse({ content: '   ', visibility: 'public' })).toThrow()
    expect(() => letterSubmissionSchema.parse({ content: 'hello', visibility: 'secret' })).toThrow()
  })

  it('derives a deterministic six-digit postal code', () => {
    const first = deriveLetterPostalCode('letter-001')
    expect(first).toMatch(/^\d{6}$/)
    expect(deriveLetterPostalCode('letter-001')).toBe(first)
    expect(deriveLetterPostalCode('letter-002')).not.toBe(first)
  })
})
