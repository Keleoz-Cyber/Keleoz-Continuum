import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '@/db/schema'
import { createLettersRepository, LetterRateLimitError } from '@/modules/letters/repository'
import { createTestPool } from '@/test/db'

const pool = createTestPool()
const repository = createLettersRepository(drizzle(pool, { schema }))

beforeEach(async () => {
  await pool.query('delete from letters')
})

afterAll(async () => {
  await pool.end()
})

describe('letters repository', () => {
  it('keeps submissions pending and excludes them from the public wall', async () => {
    const letter = await repository.submit({
      senderName: 'Keleoz',
      content: 'A note waiting at the window.',
      visibility: 'public',
      sourceHash: 'source-one',
    })

    expect(letter.status).toBe('pending')
    expect(letter.postalCode).toMatch(/^\d{6}$/)
    await expect(repository.listPublic()).resolves.toEqual([])
    await expect(repository.listForOwner()).resolves.toEqual([
      expect.objectContaining({ id: letter.id, content: letter.content, status: 'pending' }),
    ])
  })

  it('publishes only approved public letters and never exposes the source hash', async () => {
    const publicLetter = await repository.submit({
      senderName: 'A visitor',
      content: 'Please leave the light on.',
      visibility: 'public',
      sourceHash: 'source-two',
    })
    const privateLetter = await repository.submit({
      senderName: undefined,
      content: 'This should stay between us.',
      visibility: 'private',
      sourceHash: 'source-three',
    })

    await repository.review({ id: publicLetter.id, status: 'approved', ownerReply: 'I will.' })
    await repository.review({ id: privateLetter.id, status: 'approved', ownerReply: 'Received.' })

    await expect(repository.listPublic()).resolves.toEqual([
      expect.objectContaining({
        id: publicLetter.id,
        postalCode: publicLetter.postalCode,
        senderName: 'A visitor',
        ownerReply: 'I will.',
        visibility: 'public',
        status: 'approved',
      }),
    ])
    const publicShape = (await repository.listPublic())[0]
    expect(publicShape).not.toHaveProperty('sourceHash')
  })

  it('limits a source to three submissions per hour', async () => {
    for (let index = 0; index < 3; index += 1) {
      await repository.submit({
        senderName: undefined,
        content: `Letter ${index}`,
        visibility: 'private',
        sourceHash: 'same-source',
      })
    }

    await expect(
      repository.submit({
        senderName: undefined,
        content: 'Too many letters',
        visibility: 'private',
        sourceHash: 'same-source',
      }),
    ).rejects.toBeInstanceOf(LetterRateLimitError)
  })
})
