/** Never pass an untrusted scheme or a download/API URL to the client router. */
export function internalNavigationTarget(href: string, base: string): string | null {
  if(href.startsWith('#'))return null
  try {
    const target=new URL(href,base),current=new URL(base)
    if(target.origin!==current.origin||!['http:','https:'].includes(target.protocol))return null
    if(!/^\/(?:$|(?:blog|projects|moments|pages|studio)(?:\/|$)|(?:about|room|tea|story|tarot|character|letters|chat|memory|calendar|search|timeline|history|music)\/?$)/.test(target.pathname))return null
    return target.pathname+target.search+target.hash
  } catch { return null }
}
