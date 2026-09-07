export const homeCanvasUrl = '/reference/internal-beyond/bg-canvas.png'

/** Keep original PNG bytes, including Chrome's exact alpha handling; only prioritize delivery. */
export function prioritizeHomeCanvas(html: string, canvasUrl = homeCanvasUrl): string {
  const href = canvasUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
  return html.replace(/bg-canvas\.(?:jpg|png)/g, () => canvasUrl)
    .replace('<head>', `<head><link rel="preload" as="image" fetchpriority="high" href="${href}">`)
}
