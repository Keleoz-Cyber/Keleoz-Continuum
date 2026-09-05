import { expect, it } from 'vitest'
import { publicWebUrl, searchQuery } from '@/modules/web-search/contracts'
import { freeWebSearch } from '@/modules/web-search/provider'
import { searchRuntime } from '@/modules/source-native/search-runtime'

it('sends only an explicit current search query, not private injected context or history', () => {
  expect(searchQuery([{role:'system',content:'private'}, {role:'user',content:'private memory\n【用户当前消息】\n搜索 Next.js 缓存文档'}])).toBe('Next.js 缓存文档')
  expect(searchQuery([{role:'user',content:'昨天很开心'}])).toBeNull()
  expect(searchQuery([{role:'user',content:'搜索 官方说明'}])).toBe('官方说明')
  expect(searchQuery([{role:'user',content:'搜索 官方说明\n\n[文件上传: secret.txt]\n私人附件正文'}])).toBe('官方说明')
  expect(searchQuery([{role:'user',content:'请总结附件\n\n[文件上传: secret.txt]\n【用户当前消息】\n搜索 PRIVATE_ATTACHMENT_SENTINEL'}])).toBeNull()
  expect(searchQuery([{role:'user',content:'[Keleoz] 搜索 官方说明'}])).toBe('官方说明')
  expect(searchQuery([{role:'user',content:'【用户当前消息】\n搜索 quoted secret',_continuumRawUser:'请总结引用'}])).toBeNull()
  expect(searchQuery([{role:'user',content:'不要搜索最新新闻'}])).toBeNull()
  expect(searchQuery([{role:'user',content:'搜索 新闻'},{role:'assistant',content:'继续'}])).toBeNull()
})

it('calls only the fixed free search tool, never forwarding headers or arbitrary tool names', async () => {
  const calls: Array<{method:string;params:Record<string,unknown>}> = []
  const fake = (async (url, options) => {
    expect(url).toBe('https://search.parallel.ai/mcp')
    expect(new Headers(options?.headers).has('authorization')).toBe(false)
    const body=JSON.parse(String(options?.body));calls.push(body)
    if(body.method.startsWith('notifications'))return new Response(null,{status:202})
    const result=body.method==='initialize'?{protocolVersion:'2025-06-18'}:{structuredContent:{results:[{title:'Official',url:'https://example.com',excerpts:['Useful text']},{url:'javascript:alert(1)',title:'bad'}]}}
    return Response.json({jsonrpc:'2.0',id:body.id,result})
  }) as typeof fetch
  const result=await freeWebSearch('official docs',new AbortController().signal,fake)
  expect(calls.map(c=>c.method)).toEqual(['initialize','notifications/initialized','tools/call'])
  expect(calls[2].params.name).toBe('web_search')
  expect(result).toEqual([{title:'Official',url:'https://example.com/',excerpt:'Useful text'}])
})

it('only permits public HTTPS source links and rejects credentials and private addresses', () => {
  expect(publicWebUrl('https://example.com/article')).toBe('https://example.com/article')
  for(const url of ['javascript:alert(1)','https://user:pass@example.com','https://localhost/a','https://127.0.0.1','https://10.0.0.1','https://[::1]','https://169.254.169.254','https://example.com:8443']) expect(publicWebUrl(url)).toBeNull()
})

it('reads SSE packets by matching request id and never follows redirects', async () => {
  const fake=(async(_url,options)=>{
    expect(options?.redirect).toBe('error')
    const call=JSON.parse(String(options?.body))
    if(call.method.startsWith('notifications'))return new Response(null,{status:202})
    const result=call.method==='initialize'?{protocolVersion:'2025-06-18'}:{content:[{type:'text',text:JSON.stringify({results:[{url:'https://example.com',title:'Source',excerpts:['Evidence']}]})}]}
    return new Response('data: '+JSON.stringify({id:999,result:{}})+'\n\ndata: '+JSON.stringify({id:call.id,result})+'\n\n',{headers:{'content-type':'text/event-stream'}})
  }) as typeof fetch
  expect((await freeWebSearch('read source',new AbortController().signal,fake))[0].excerpt).toBe('Evidence')
})

it('only searches once during Desktop continuations and retains the original searchLog contract', async () => {
  let calls=0
  const mockFetch=async()=>{calls++;return Response.json({query:'docs',results:[{title:'Docs',url:'https://example.com'}],context:'external evidence'})}
  const create=new Function('fetch',searchRuntime+`;let _callApiChatStreamOnce=async(cfg,messages)=>({cfg,messages});let _callApiChatOnce=_callApiChatStreamOnce;installDesktopSearch();return _callApiChatStreamOnce;`)
  const call=create(mockFetch),state={},searchLog:unknown[]=[]
  const first=await call({webSearch:true},[{role:'user',content:'搜索 docs'}],{_st:state,searchLog})
  await call({webSearch:true},[{role:'user',content:'继续'}],{_st:state,searchLog})
  expect(calls).toBe(1);expect(searchLog).toHaveLength(1)
  expect(first.cfg.webSearch).toBe(false)
  expect(first.messages[0].content).toBe('external evidence')
})

it('stops before calling the model when the original Desktop stop control cancels search', async () => {
  let modelCalls=0
  const create=new Function('fetch','model',searchRuntime+`;let _callApiChatStreamOnce=model;let _callApiChatOnce=model;installDesktopSearch();return _callApiChatStreamOnce;`)
  const fetcher=(_url:string,options:RequestInit)=>new Promise((_resolve,reject)=>options.signal?.addEventListener('abort',()=>reject(new DOMException('cancelled','AbortError'))))
  const call=create(fetcher,()=>{modelCalls++}),state:{ac?:AbortController;stopped?:boolean}={}
  const pending=call({webSearch:true},[{role:'user',content:'搜索 docs'}],{_st:state})
  state.stopped=true;state.ac!.abort()
  await expect(pending).rejects.toMatchObject({name:'AbortError'})
  expect(modelCalls).toBe(0)
})

it('reports free-provider rate limits without retrying a paid provider', async () => {
  let calls=0
  await expect(freeWebSearch('query',new AbortController().signal,(async()=>{calls++;return new Response(null,{status:429})}) as typeof fetch)).rejects.toThrow('限流')
  expect(calls).toBe(1)
})
