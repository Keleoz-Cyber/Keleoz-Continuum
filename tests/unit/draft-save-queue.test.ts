import { expect,it } from 'vitest'
import { DraftSaveQueue } from '@/modules/editor/draft-save-queue'
import type { DraftSnapshot } from '@/modules/content/schemas'
const snapshot=(title:string):DraftSnapshot=>({title,subtitle:null,categoryLabel:null,summary:'',exposure:'hidden',document:{type:'doc',content:[]}})
it('serializes edits while a save is pending and retains the acknowledged revision',async()=>{
  let release!:()=>void;const writes:Array<[string,number]>=[]
  const queue=new DraftSaveQueue(snapshot('A'),1,async(s,r)=>{writes.push([s.title,r]);if(writes.length===1)await new Promise<void>(resolve=>{release=resolve});return r+1},()=>{})
  queue.update(snapshot('B'));const saving=queue.flush();await Promise.resolve()
  expect(writes).toEqual([['B',1]])
  queue.update(snapshot('C'));release();await saving
  expect(writes).toEqual([['B',1],['C',2]])
  expect(queue.revision).toBe(3);expect(queue.dirty()).toBe(false)
})
it('does not adopt a conflicting server revision or silently overwrite on retry',async()=>{
  const queue=new DraftSaveQueue(snapshot('A'),1,async()=>{throw new Error('draft_conflict')},()=>{})
  queue.update(snapshot('B'))
  await expect(queue.flush()).rejects.toThrow('draft_conflict')
  expect(queue.revision).toBe(1);expect(queue.dirty()).toBe(true)
})
