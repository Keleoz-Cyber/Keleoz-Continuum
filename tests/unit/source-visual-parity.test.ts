import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { adaptDesktopSourceForPublicHome } from '@/modules/home/source-html-adapter'

describe('source visual parity adapters', () => {
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
  })
})
