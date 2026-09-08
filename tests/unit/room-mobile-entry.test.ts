import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('offers existing mobile apps instead of a future-only Room notice', () => {
  const source = readFileSync('src/modules/room/room-client.tsx', 'utf8')
  const mobile = source.slice(source.indexOf('if (mobile) {'), source.indexOf('  return (', source.indexOf('if (mobile) {')))
  for (const href of ['/tea', '/story', '/tarot', '/character']) expect(mobile.includes(`href="${href}"`)).toBe(true)
  expect(mobile.includes('会以独立 App 形式提供')).toBe(false)
  expect(mobile.includes('source-public-bg')).toBe(true)
})
