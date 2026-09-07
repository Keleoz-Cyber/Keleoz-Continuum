/** Delivery adapter only: preserve source family/weight/style and unicode subsets. */
export function localizeSourceFonts(html: string): string {
  return html
    .replace(/<link\b[^>]*\brel=["']preconnect["'][^>]*https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/gi, '')
    .replace(/https:\/\/fonts\.googleapis\.com\/css[^'"\s)<>]+/g, '/fonts/source.css')
    .replace(/https:\/\/fonts\.(?:googleapis|gstatic)\.com/g, '')
    .replace(/(["'])game\/game_module\.js\1/g, '$1game/game_module.js?continuum-local=1$1')
}
