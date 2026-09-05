import { expect, it, vi } from 'vitest'
import { autosaveRuntime } from '@/modules/source-native/autosave'
const create = new Function(`${autosaveRuntime};return createSourceAutosave;`)()
it('coalesces input and saves edits made during an in-flight request serially', async () => {
  vi.useFakeTimers()
  let value = 'first', release!: () => void
  const writes: string[] = []
  const controller = create({read:()=>value,accept:()=>{},status:()=>{},write:async(v:string)=>{writes.push(v);if(writes.length===1)await new Promise<void>(r=>{release=r})}})
  controller.reset(); value='second';controller.change()
  await vi.advanceTimersByTimeAsync(900)
  expect(writes).toEqual(['second'])
  value='third';controller.change();release()
  await controller.flush()
  expect(writes).toEqual(['second','third'])
  expect(controller.dirty()).toBe(false)
  vi.useRealTimers()
})
it('keeps failed changes dirty, does not spin retries, and supports explicit retry', async () => {
  let value='old', fail=true
  const write=vi.fn(async()=>{if(fail)throw new Error('offline')})
  const controller=create({read:()=>value,write,accept:()=>{},status:()=>{}})
  controller.reset();value='new'
  await expect(controller.flush()).rejects.toThrow('offline')
  expect(controller.dirty()).toBe(true)
  expect(write).toHaveBeenCalledTimes(1)
  fail=false;await controller.flush()
  expect(controller.dirty()).toBe(false)
})
