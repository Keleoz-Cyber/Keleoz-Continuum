import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { adaptDesktopSourceForPublicHome } from '@/modules/home/source-html-adapter'

it('delegates native loading presentation without changing source exit timing', () => {
  const source = readFileSync('upstream/InternalBeyond-Desktop/InternalBeyond.html', 'utf8')
  const html = adaptDesktopSourceForPublicHome(source)
  expect(html.includes('id="continuum-loading-feedback-style"')).toBe(true)
  expect(html.includes('#preloader{visibility:hidden!important;pointer-events:none!important}')).toBe(true)
  expect(html.includes('class="continuum-loading-track" role="progressbar"')).toBe(false)
  expect(html).toContain('setTimeout(reveal,10000)')
  expect(html).toContain('setTimeout(reveal,350)')
  expect(adaptDesktopSourceForPublicHome(html)).toBe(html)
})

it('waits for a responsive surface before starting an iframe and shows a retry affordance', () => {
  const frame = readFileSync('src/modules/home/source-home-frame.tsx', 'utf8')
  expect(frame.includes('useState<boolean | null>(null)')).toBe(true)
  expect(frame).toContain('mobile === null ? null :')
  expect(frame).toContain('role="progressbar"')
  expect(frame).toContain('重新加载')
  expect(frame).toContain('window.location.reload()')
  expect(frame).toContain('__continuumSiteApplied')
  expect(frame).toContain("if (!mobile && nativeLoader && !nativeLoader.classList.contains('fade-out')) return")
  expect(frame).toContain("dispatchEvent(new Event('continuum:home-ready'))")
  expect(frame).toContain('window.clearInterval(readinessTimer)')
  expect(frame).toContain("loaded ? ' is-ready' : ''")
  expect(frame).not.toContain('{!loaded ? <div')
})

it('hides the mobile native loading presentation only in the public adapter', async () => {
  const { delegateSourceLoading } = await import('@/modules/home/loading-feedback')
  const source = readFileSync('upstream/InternalBeyond-Mobile/index.html', 'utf8')
  const html = delegateSourceLoading(source, true)
  expect(html.includes('#ib-splash{visibility:hidden!important;pointer-events:none!important}')).toBe(true)
  expect(html.includes("addEventListener('continuum:home-ready',cleanup,{once:true});clearAll();")).toBe(true)
  expect(html.replace(/<style id="continuum-loading-feedback-style">[^<]*<\/style>/, '').replace("addEventListener('continuum:home-ready',cleanup,{once:true});clearAll();", 'raf=requestAnimationFrame(frame);') === source).toBe(true)
  expect(delegateSourceLoading(html, true) === html).toBe(true)
})
