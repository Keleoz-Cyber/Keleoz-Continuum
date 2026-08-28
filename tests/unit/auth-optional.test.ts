import { describe, expect, it } from 'vitest'

import { resolveOptionalOwner } from '@/modules/auth/optional'

describe('optional public-page Owner decoration', () => {
  it('returns a resolved Owner when authentication storage is available', async () => {
    const owner = { id: 'owner-1', username: 'keleoz' }

    await expect(resolveOptionalOwner(async () => owner)).resolves.toEqual(owner)
  })

  it('fails closed to Guest when optional authentication storage is unavailable', async () => {
    await expect(resolveOptionalOwner(async () => {
      throw new Error('database unavailable')
    })).resolves.toBeNull()
  })
})
