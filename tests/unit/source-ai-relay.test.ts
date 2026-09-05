import { expect,it,vi } from 'vitest'
import { relaySourceResponse } from '@/modules/ai/source-relay'
it('passes SSE unchanged, accounts reasoning-inclusive usage and finalizes once',async()=>{
  const text='data: '+JSON.stringify({id:'test',choices:[{delta:{content:'你好'},finish_reason:'stop'}]})+'\n\ndata: '+JSON.stringify({choices:[],usage:{prompt_tokens:20,completion_tokens:321}})+'\n\ndata: [DONE]\n\n'
  const finish=vi.fn(async()=>{}),release=vi.fn()
  const body=relaySourceResponse(new Response(text),{stream:true,signal:new AbortController().signal,abort:()=>{},finish,release})
  expect(await new Response(body).text()).toBe(text)
  expect(finish).toHaveBeenCalledWith({status:'completed',promptTokens:20,completionTokens:321,outputCharacters:2,providerRequestId:'test'})
  expect(release).toHaveBeenCalledTimes(1)
})
it('aborts the upstream and records cancellation rather than successful completion',async()=>{
  const finish=vi.fn(async()=>{}),release=vi.fn(),abort=vi.fn(),upstreamCancel=vi.fn()
  const upstream=new Response(new ReadableStream({cancel:upstreamCancel}))
  const body=relaySourceResponse(upstream,{stream:true,signal:new AbortController().signal,abort,finish,release})
  await body.cancel()
  expect(abort).toHaveBeenCalledTimes(1);expect(upstreamCancel).toHaveBeenCalledTimes(1)
  expect(finish).toHaveBeenCalledWith(expect.objectContaining({status:'failed',errorCode:'source_chat_cancelled'}));expect(release).toHaveBeenCalledTimes(1)
})
it('records length truncation with usage instead of silently marking it complete',async()=>{
  const finish=vi.fn(async()=>{})
  const body=relaySourceResponse(Response.json({id:'cut',choices:[{message:{content:null},finish_reason:'length'}],usage:{prompt_tokens:30,completion_tokens:1000}}),{stream:false,signal:new AbortController().signal,abort:()=>{},finish,release:()=>{}})
  await new Response(body).text()
  expect(finish).toHaveBeenCalledWith(expect.objectContaining({status:'failed',errorCode:'source_chat_truncated',completionTokens:1000}))
})
it('handles the client abort signal during a pending read and releases once',async()=>{
  const aborter=new AbortController(),finish=vi.fn(async()=>{}),release=vi.fn()
  const body=relaySourceResponse(new Response(new ReadableStream()),{stream:true,signal:aborter.signal,abort:()=>{},finish,release})
  const reading=new Response(body).text();aborter.abort()
  await expect(reading).rejects.toThrow('aborted')
  expect(finish).toHaveBeenCalledTimes(1);expect(release).toHaveBeenCalledTimes(1)
})
it('distinguishes an upstream deadline from an explicit client cancellation',async()=>{
  const deadline=new AbortController(),finish=vi.fn(async()=>{})
  const body=relaySourceResponse(new Response(new ReadableStream()),{stream:true,signal:deadline.signal,abort:()=>{},finish,release:()=>{}})
  const reading=new Response(body).text();deadline.abort(new DOMException('deadline','TimeoutError'))
  await expect(reading).rejects.toThrow()
  expect(finish).toHaveBeenCalledWith(expect.objectContaining({errorCode:'source_chat_timeout'}))
})
