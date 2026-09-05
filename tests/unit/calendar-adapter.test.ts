import { describe, expect, it } from 'vitest'
import { getCalendarRecurrenceScript, preserveCalendarFields, calendarVisibleTo } from '@/modules/source-native/calendar'

describe('native Calendar cross-device compatibility', () => {
  it('retains the original selected-companion visibility on Mobile', () => {
    expect(calendarVisibleTo({vis:'ais:a|b'},'b')).toBe(true)
    expect(calendarVisibleTo({vis:'ai:a'},'a')).toBe(true)
    expect(calendarVisibleTo({vis:'ais:a|b'},'c')).toBe(false)
    expect(calendarVisibleTo({vis:'self'},'a')).toBe(false)
    expect(calendarVisibleTo({},'a')).toBe(false)
  })
  it('keeps Desktop-only visibility and weekdays when the Mobile form edits a title', () => {
    const old = { id: 'event', title: 'before', repeat: 'weekly', weekdays: [1, 4], vis: 'ais:a|b', remind: true }
    expect(preserveCalendarFields(old, { id: 'event', title: 'after', repeat: 'weekly', vis: 'all', remind: true })).toMatchObject({ title: 'after', weekdays: [1, 4], vis: 'ais:a|b' })
    expect(preserveCalendarFields(old, { repeat: 'once', vis: 'self', remind: false })).toEqual({ repeat: 'once', vis: 'self', remind: false })
  })
  it('uses the original Desktop recurrence rules on both surfaces', () => {
    const occurs = new Function(getCalendarRecurrenceScript() + ';return evOccursOn')() as (event: Record<string, unknown>, date: string) => boolean
    expect(occurs({ date: '2026-01-31', repeat: 'monthly' }, '2026-02-28')).toBe(true)
    expect(occurs({ date: '2024-02-29', repeat: 'yearly' }, '2026-02-28')).toBe(true)
    expect(occurs({ date: '2026-09-01', endDate: '2026-09-05', repeat: 'daily' }, '2026-09-06')).toBe(false)
    expect(occurs({ date: '2026-09-01', repeat: 'weekly', weekdays: [1, 4] }, '2026-09-03')).toBe(true)
  })
})
