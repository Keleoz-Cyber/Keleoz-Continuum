import { expect,it } from 'vitest'
import { flushLeaveGuards,registerLeaveGuard } from '@/modules/home/leave-guards'
it('awaits registered saves and removes released workspaces',async()=>{
  let finish!:()=>void,done=false
  const remove=registerLeaveGuard(()=>new Promise<void>(r=>{finish=r}))
  const save=flushLeaveGuards().then(()=>{done=true})
  await Promise.resolve();expect(done).toBe(false)
  finish();await save;expect(done).toBe(true)
  remove();await expect(flushLeaveGuards()).resolves.toBeUndefined()
})
it('propagates save failure so navigation is not performed',async()=>{
  const remove=registerLeaveGuard(async()=>{throw new Error('conflict')})
  try{await expect(flushLeaveGuards()).rejects.toThrow('conflict')}finally{remove()}
})
