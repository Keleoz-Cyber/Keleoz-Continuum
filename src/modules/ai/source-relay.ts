export type RelayResult={status:'completed'|'failed';errorCode?:string;promptTokens:number;completionTokens:number;outputCharacters:number;providerRequestId:string}
export function relaySourceResponse(upstream:Response,options:{stream:boolean;signal:AbortSignal;abort:()=>void;finish:(result:RelayResult)=>Promise<void>;release:()=>void}){
  const reader=upstream.body!.getReader(),decoder=new TextDecoder()
  let buffer='',finishReason='',cancelled=false,settled:Promise<void>|null=null
  const stats={promptTokens:0,completionTokens:0,outputCharacters:0,providerRequestId:''}
  let downstream:ReadableStreamDefaultController<Uint8Array>|undefined
  const collect=(line:string)=>{
    if(!line.trim()||line.startsWith(':')||line.trim()==='data: [DONE]')return
    const item=JSON.parse(line.replace(/^data:\s*/,''))
    if(item.id)stats.providerRequestId=String(item.id)
    if(item.usage){stats.promptTokens=Number(item.usage.prompt_tokens)||0;stats.completionTokens=Number(item.usage.completion_tokens)||0}
    const choice=item.choices?.[0]
    if(choice?.finish_reason)finishReason=choice.finish_reason
    stats.outputCharacters+=String(choice?.delta?.content??choice?.message?.content??'').length
  }
  const settle=(errorCode?:string)=>{
    if(!settled)settled=Promise.resolve().then(()=>options.finish({...stats,status:errorCode?'failed':'completed',...(errorCode?{errorCode}:{})})).finally(()=>{options.signal.removeEventListener('abort',onAbort);options.release()})
    return settled
  }
  const cancel=async(errorCode='source_chat_cancelled')=>{
    if(settled)return settled
    cancelled=true;options.abort()
    await reader.cancel().catch(()=>{})
    await settle(errorCode)
  }
  const onAbort=()=>{if(cancelled||settled)return;const timedOut=options.signal.reason?.name==='TimeoutError';void cancel(timedOut?'source_chat_timeout':'source_chat_cancelled').finally(()=>{try{downstream?.error(new Error(timedOut?'AI request timed out':'AI request aborted'))}catch{}}).catch(()=>{})}
  return new ReadableStream<Uint8Array>({
    start(controller){downstream=controller;options.signal.addEventListener('abort',onAbort,{once:true});if(options.signal.aborted)onAbort()},
    async pull(controller){
      try{
        const chunk=await reader.read()
        if(cancelled)return
        if(chunk.done){
          buffer+=decoder.decode();if(buffer.trim())collect(buffer)
          await settle(finishReason==='length'?'source_chat_truncated':stats.outputCharacters===0?'source_chat_empty':undefined)
          controller.close();return
        }
        buffer+=decoder.decode(chunk.value,{stream:true})
        if(options.stream){const lines=buffer.split('\n');buffer=lines.pop()??'';for(const line of lines)if(line.startsWith('data:')||line.startsWith(':'))collect(line)}
        if(buffer.length>4_000_000)throw new Error('AI response too large')
        controller.enqueue(chunk.value)
      }catch(error){
        if(cancelled)return
        cancelled=true;options.abort();await reader.cancel().catch(()=>{})
        try{await settle('source_chat_failed')}finally{controller.error(error)}
      }
    },
    cancel(){return cancel()},
  })
}
