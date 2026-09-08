import { expect, it } from 'vitest'
import { decodeGuestHistory, exportGuestHistory } from '@/modules/history/contracts'

const tea = { id:'tea-history:tea_1',type:'tea-history',version:1,title:'茶歇',subtitle:'记录',content:'<script>private</script>',createdAt:1,updatedAt:2 }
it('accepts existing transcript records but excludes Room state and malformed data',()=>{
  expect(decodeGuestHistory(tea)).toEqual(tea)
  expect(decodeGuestHistory({...tea,type:'room-source-state'})).toBeNull()
  expect(decodeGuestHistory({...tea,id:'other'})).toBeNull()
  expect(decodeGuestHistory({...tea,content:null})).toBeNull()
  expect(decodeGuestHistory({...tea,version:2})).toBeNull()
})
it('exports an explicit versioned transcript archive without unrelated properties',()=>{
  const decoded=decodeGuestHistory({...tea,secret:'not-a-history-field'})!
  const exported=JSON.parse(exportGuestHistory([decoded]))
  expect(exported.format).toBe('keleoz-local-history')
  expect(exported.version).toBe(1)
  expect(exported.records).toEqual([tea])
  expect(exported.records[0].content).toBe('<script>private</script>')
})
