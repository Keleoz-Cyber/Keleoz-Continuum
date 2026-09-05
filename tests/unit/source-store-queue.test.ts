import { expect, it } from 'vitest'
import { createSourceStoreQueue } from '@/modules/source-native/store-queue'

it('orders fire-and-forget Calendar ledger writes before subsequent reads', async () => {
  const queue = createSourceStoreQueue()
  let saved = 0
  let release!: () => void
  const delay = new Promise<void>(resolve => { release = resolve })
  const write = queue.run('calLedger', async () => { await delay; saved = 1 })
  const read = queue.run('calLedger', async () => saved)
  release()
  await write
  expect(await read).toBe(1)
})

it('reports a failed operation but does not poison later retries', async () => {
  const queue = createSourceStoreQueue()
  await expect(queue.run('calNotes', async () => { throw new Error('offline') })).rejects.toThrow('offline')
  expect(await queue.run('calNotes', async () => 'saved')).toBe('saved')
})
