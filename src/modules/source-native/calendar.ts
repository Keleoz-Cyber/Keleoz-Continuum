import { readFileSync } from 'node:fs'

export function calendarVisibleTo(event: Record<string, unknown>, companion: string) {
  const visibility = String(event.vis || 'self')
  if (visibility === 'all') return true
  if (visibility.startsWith('ais:')) return visibility.slice(4).split('|').includes(companion)
  return visibility === 'ai:' + companion
}

export function preserveCalendarFields(previous: Record<string, unknown> | undefined, incoming: Record<string, unknown>) {
  const next = { ...incoming }
  if (!previous) return next
  // Mobile has no multi-companion or multi-weekday controls. A title edit must
  // not broaden visibility or discard the Desktop recurrence selection.
  if (/^ais?:/.test(String(previous.vis)) && incoming.remind === previous.remind) next.vis = previous.vis
  if (incoming.repeat === 'weekly' && previous.repeat === 'weekly') {
    for (const key of ['weekdays', 'weekday']) if (previous[key] !== undefined && incoming[key] === undefined) next[key] = previous[key]
  }
  return next
}

export function getCalendarRecurrenceScript() {
  const source = readFileSync('upstream/InternalBeyond-Desktop/InternalBeyond.html', 'utf8')
  const start = source.indexOf('function calDate(s){')
  const end = source.indexOf('function nextOcc(it,from){', start)
  if (start < 0 || end < start) throw new Error('Original Calendar recurrence boundary missing')
  return `var evOccursOn=(function(){${source.slice(start, end)}\nreturn function(it,iso){var d=calDate(iso);return !!d&&occursOn(it,d)}})();`
}
