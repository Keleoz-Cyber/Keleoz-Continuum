export type SearchResult = { title: string; url: string; excerpt: string }
export function searchQuery(messages: Array<{role: string; content: unknown; _continuumRawUser?:string}>): string | null {
  const last=messages[messages.length-1]
  if(last?.role!=='user')return null
  const raw=typeof last.content==='string'?last.content:Array.isArray(last.content)?last.content.filter(p=>p?.type==='text').map(p=>p.text).join('\n'):''
  const withoutFiles=raw.split(/\r?\n\r?\n\[文件上传:/)[0]
  const marker=withoutFiles.lastIndexOf('【用户当前消息】')
  // Source Chat appends file bodies/quotes after the user's message. Search only
  // the explicit first line; never send appended attachments or private context.
  const current=typeof last._continuumRawUser==='string'?last._continuumRawUser:marker>=0?withoutFiles.slice(marker+'【用户当前消息】'.length):withoutFiles
  const text=current.trim().split(/\r?\n/)[0].replace(/^\[[^\]\n]{1,80}\]\s+/,'')
  const match=text.trim().match(/^(?:请\s*)?(?:联网搜索|搜索|搜一下|查一下|\/search|search|阅读|读取网页|browse)\s*[:：]?\s+(.+)$/is)
    ||text.trim().match(/^(?:请\s*)?(?:联网搜索|搜索|搜一下|查一下|阅读|读取网页)\s*[:：]?\s*(.+)$/s)
  return match?.[1]?.trim()||null
}
export function publicWebUrl(value: string): string | null {
  try {
    const url=new URL(value),host=url.hostname.toLowerCase()
    if(url.protocol!=='https:'||url.username||url.password||url.port||host.includes(':')||!host.includes('.')||/^[\d.]+$/.test(host)||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))return null
    return url.href
  }catch{return null}
}
