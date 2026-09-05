import { publicWebUrl, type SearchResult } from './contracts'

export async function freeWebSearch(query: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<SearchResult[]> {
  if(!query.trim()||query.length>600)throw new Error('查询请控制在 600 字以内。')
  let session='',id=0,protocol='2025-06-18'
  const rpc=async(method:string,params:Record<string,unknown>)=>{
    const callId=method.startsWith('notifications/')?undefined:++id
    const response=await fetcher('https://search.parallel.ai/mcp',{method:'POST',redirect:'error',signal,
      headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':protocol,...(session?{'mcp-session-id':session}:{})},
      body:JSON.stringify({jsonrpc:'2.0',id:callId,method,params})})
    if(!response.ok){await response.body?.cancel();throw new Error(response.status===429?'免费搜索已限流，请稍后重试。':'免费搜索暂时不可用，请稍后重试。')}
    session=response.headers.get('mcp-session-id')||session
    if(callId===undefined){await response.body?.cancel();return {}}
    const reader=response.body!.getReader(),decoder=new TextDecoder(),sse=response.headers.get('content-type')?.includes('text/event-stream')
    let buffer='',size=0
    try{
      while(true){
        const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});size+=value?.length||0
        if(size>2_000_000)throw new Error('搜索结果过大，请缩小查询范围。')
        const packets=sse?buffer.split(/\r?\n\r?\n/):done?[buffer]:[]
        if(sse)buffer=packets.pop()||''
        if(done&&sse&&buffer.trim())packets.push(buffer)
        for(const packet of packets){
          const raw=sse?packet.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n'):packet
          let data;try{data=JSON.parse(raw)}catch{continue}
          const entry=(Array.isArray(data)?data:[data]).find(item=>item?.id===callId)
          if(!entry)continue
          if(entry.error||entry.result?.isError)throw new Error('搜索服务未能完成查询，请稍后重试。')
          return entry.result as Record<string,unknown>
        }
        if(done)break
      }
      throw new Error('搜索响应不完整，请重试。')
    }finally{await reader.cancel().catch(()=>{})}
  }
  const initialized=await rpc('initialize',{protocolVersion:protocol,capabilities:{},clientInfo:{name:'Keleoz-Continuum-Search',version:'1'}})
  if(typeof initialized.protocolVersion==='string')protocol=initialized.protocolVersion
  await rpc('notifications/initialized',{})
  const found=query.match(/https?:\/\/[^\s<>"）)]+/g)||[]
  const urls=found.map(publicWebUrl)
  if(found.length&&urls.some(url=>!url))throw new Error('只能读取不含账号信息的公开 HTTPS 网页。')
  const result=await rpc('tools/call',urls.length?{name:'web_fetch',arguments:{urls:urls.slice(0,2),objective:query.slice(0,200),full_content:false}}:{name:'web_search',arguments:{objective:query,search_queries:[query]}})
  const out:SearchResult[]=[],seen=new Set<string>()
  const visit=(node:unknown,depth=0)=>{
    if(depth>10||out.length>=6||!node)return
    if(typeof node==='string'){try{visit(JSON.parse(node),depth+1)}catch{}return}
    if(Array.isArray(node)){node.slice(0,30).forEach(item=>visit(item,depth+1));return}
    if(typeof node!=='object')return
    const record=node as Record<string,unknown>,url=typeof record.url==='string'?publicWebUrl(record.url):null
    if(url&&!seen.has(url)){
      const excerpts=Array.isArray(record.excerpts)?record.excerpts.join('\n'):String(record.excerpt||record.text||record.content||'')
      seen.add(url);out.push({url,title:String(record.title||url).slice(0,200),excerpt:excerpts.slice(0,2500)})
    }
    Object.values(record).forEach(child=>visit(child,depth+1))
  }
  visit(result)
  if(!out.length)throw new Error('没有取得可引用的搜索结果，请换个关键词。')
  return out
}
