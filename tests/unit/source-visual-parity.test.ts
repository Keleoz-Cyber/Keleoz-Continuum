import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { adaptDesktopSourceForPublicHome } from '@/modules/home/source-html-adapter'

describe('source visual parity adapters', () => {
  it('removes both original Mobile lock layers from the public home', () => {
    const patch = readFileSync('src/modules/home/mobile-public-patch.ts', 'utf8')
    expect(patch).toContain("querySelectorAll('#lockscr,#lk-preveil')")
    expect(patch).toContain('#lockscr,#lk-preveil{display:none!important}')
  })
  it('injects the source gloss fallback before the immutable source scripts run', () => {
    const html = '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'
    const adapted = adaptDesktopSourceForPublicHome(html)

    expect(adapted).toContain('__continuumSourceGlossFallback')
    expect(adapted.indexOf('__continuumSourceGlossFallback')).toBeLessThan(adapted.indexOf('</head>'))
    expect(adapted).toContain('<meta charset="utf-8">')

    const script = adapted.match(/<script id="continuum-source-gloss-bootstrap">([\s\S]*?)<\/script>/)?.[1]
    expect(script).toBeTruthy()

    const prototype = { getImageData: () => 'pixels' } as {
      getImageData: () => string
      __continuumSourceGlossFallback?: boolean
    }
    function CanvasContext() {}
    CanvasContext.prototype = prototype
    runInNewContext(script!, {
      CanvasRenderingContext2D: CanvasContext,
      DOMException,
      window: { CanvasRenderingContext2D: CanvasContext },
    })

    expect(prototype.__continuumSourceGlossFallback).toBe(true)
    expect(() => prototype.getImageData()).toThrowError(/source gloss fallback/i)

    const wrapped = prototype.getImageData
    runInNewContext(script!, {
      CanvasRenderingContext2D: CanvasContext,
      DOMException,
      window: { CanvasRenderingContext2D: CanvasContext },
    })
    expect(prototype.getImageData).toBe(wrapped)
  })

  it('keeps the public subpage composition on the source light-theme values', () => {
    const publicCss = readFileSync('src/app/source-public.css', 'utf8')
    const roomCss = readFileSync('src/app/source-room.css', 'utf8')

    expect(publicCss).toContain('brightness(.75) saturate(.85) hue-rotate(-8deg)')
    expect(publicCss).toContain('background: rgba(235,244,255,.5)')
    expect(publicCss).not.toContain('-webkit-backdrop-filter')
    expect(roomCss).toContain('min-height: 100vh')
    expect(roomCss).toContain('--silver: #b2c0d8')
    expect(roomCss).toContain('--glass-border: rgba(165,188,230,.2)')
    expect(roomCss).toContain('--accent: #5080b0')
    expect(roomCss).toContain('--white: #eff2fa')
  })

  it('adds Mobile Tea as a real Desk app without routing into the pixel Room', () => {
    const homeFrame = readFileSync('src/modules/home/source-home-frame.tsx', 'utf8')+readFileSync('src/modules/home/mobile-public-patch.ts','utf8')

    expect(homeFrame).toContain('data-page="tea"')
    expect(homeFrame).toContain("external('#sec-profile-cal .sb-app[data-page=\"tea\"]','/tea')")
    expect(homeFrame).not.toContain("external('#sec-profile-cal .sb-app[data-page=\"tea\"]','/room')")
    expect(homeFrame).toContain("window.DK_NAMES['app:tea']='茶歇'")
    expect(homeFrame).toContain("window.deskApplyLayout")
    expect(homeFrame).toContain('data-page="story"')
    expect(homeFrame).toContain("window.DK_NAMES['app:story']='故事'")
    expect(homeFrame).toContain("external('#sec-profile-cal .sb-app[data-page=\"story\"]','/story')")
    expect(homeFrame).toContain('data-page="tarot"')
    expect(homeFrame).toContain("window.DK_NAMES['app:tarot']='占卜'")
    expect(homeFrame).toContain("external('#sec-profile-cal .sb-app[data-page=\"tarot\"]','/tarot')")

    const mobileTeaCss = readFileSync('src/app/source-tea-mobile.css', 'utf8')
    expect(mobileTeaCss).toContain('object-fit: cover')
    expect(mobileTeaCss).not.toContain('object-fit: fill')
  })
})
