import { expect, it } from 'vitest'
import { nativeExternalRoute } from '@/modules/source-native/navigation'
import { nativeBootstrap, nativeMobileBootstrap } from '@/modules/source-native/bootstrap'

it('maps source data and appearance entries to authenticated server surfaces', () => {
  expect(nativeExternalRoute('data')).toBe('/studio/operations')
  expect(nativeExternalRoute('visual')).toBe('/studio/appearance?view=mobile')
  expect(nativeExternalRoute('letters')).toBe('/letters')
  for (const name of ['icode', '__proto__', 'imagegen', 'mcp']) expect(nativeExternalRoute(name)).toBeNull()
  for (const runtime of [nativeBootstrap, nativeMobileBootstrap]) {
    expect(runtime).toContain('nativeExternalRoute(')
    expect(runtime).toContain('window.__continuumFlush')
  }
})
