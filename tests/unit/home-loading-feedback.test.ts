import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { adaptDesktopSourceForPublicHome } from '@/modules/home/source-html-adapter'

it('adds an indeterminate progress track without changing source exit timing', () => {
  const source = readFileSync('upstream/InternalBeyond-Desktop/InternalBeyond.html', 'utf8')
  const html = adaptDesktopSourceForPublicHome(source)
  expect(html.includes('id="continuum-loading-feedback-style"')).toBe(true)
  expect(html.includes('class="continuum-loading-track" role="progressbar"')).toBe(true)
  expect(html.match(/class="continuum-loading-track"[^>]*>/)?.[0]).not.toContain('aria-valuenow=')
  expect(html).toContain('setTimeout(reveal,10000)')
  expect(html).toContain('setTimeout(reveal,350)')
  expect(html).toContain('prefers-reduced-motion:reduce')
  expect(adaptDesktopSourceForPublicHome(html)).toBe(html)
})

it('waits for a responsive surface before starting an iframe and shows a retry affordance', () => {
  const frame = readFileSync('src/modules/home/source-home-frame.tsx', 'utf8')
  expect(frame.includes('useState<boolean | null>(null)')).toBe(true)
  expect(frame).toContain('mobile === null ? null :')
  expect(frame).toContain('role="progressbar"')
  expect(frame).toContain('重新加载')
  expect(frame).toContain('window.location.reload()')
})
