/** Map source-only navigation to existing server-backed surfaces, not local data tools. */
export function nativeExternalRoute(page: string): string | null {
  const routes: Record<string, string> = {
    home: '/', guide: '/search', letters: '/letters', room: '/room', beyond: '/moments',
    data: '/studio/operations', visual: '/studio/appearance?view=mobile',
    diy: '/studio/appearance', space: '/studio/profile', calendar: '/calendar',
  }
  return Object.prototype.hasOwnProperty.call(routes, page) ? routes[page] : null
}
