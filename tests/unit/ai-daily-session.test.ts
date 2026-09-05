import { expect,it } from 'vitest'
import { ownerDailyAiSession } from '@/modules/ai/daily-session'
it('resets Owner daily session limits on the same UTC boundary as the usage ledger',()=>{
  const early=ownerDailyAiSession('owner',new Date('2026-09-05T01:00:00Z'))
  expect(ownerDailyAiSession('owner',new Date('2026-09-05T23:00:00Z'))).toBe(early)
  expect(ownerDailyAiSession('owner',new Date('2026-09-06T00:00:00Z'))).not.toBe(early)
})
