import { describe, expect, it } from 'vitest'
import { createMobileTarotState, drawMobileTarotCard, selectMobileTarotSpread, toggleMobileTarotGuide } from '@/modules/tarot/mobile-state'

describe('Mobile Tarot state', () => {
  it('preserves spread slot counts, guide reset, unique draws, and physical reversals', () => {
    const initial=createMobileTarotState(['major:0','major:1','major:2','major:3'])
    const timeline=selectMobileTarotSpread(initial,'timeline')
    const guided=toggleMobileTarotGuide(timeline,true)
    const one=drawMobileTarotCard(guided,0,true)
    const duplicate=drawMobileTarotCard(one,0,false)
    expect(timeline.totalSlots).toBe(3)
    expect(guided.totalSlots).toBe(4)
    expect(one.slots).toEqual([{cardId:'major:0',reversed:true}])
    expect(duplicate).toBe(one)
  })
  it('resets drawn cards whenever the spread or guide contract changes',()=>{
    const drawn=drawMobileTarotCard(createMobileTarotState(['major:0','major:1']),0,false)
    expect(selectMobileTarotSpread(drawn,'cross').slots).toEqual([])
    expect(toggleMobileTarotGuide(drawn,true).slots).toEqual([])
  })
})
