'use client'
import { useCallback,useEffect,useState } from 'react'
import type { DraftSnapshot } from '@/modules/content/schemas'
import { DraftSaveQueue,type SaveState } from './draft-save-queue'
export type AutosaveState=SaveState
export function useDraftAutosave(input:{entryId:string;initialRevision:number;snapshot:DraftSnapshot;delayMs?:number}){
  const [state,setState]=useState<SaveState>('idle')
  const [revision,setRevision]=useState(input.initialRevision)
  const [queue]=useState(()=>new DraftSaveQueue(input.snapshot,input.initialRevision,async(snapshot,expectedRevision)=>{
    const response=await fetch(`/api/studio/content/${input.entryId}/draft`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({snapshot,expectedRevision})})
    const result=await response.json()
    if(response.status===409)throw new Error('draft_conflict')
    if(!response.ok||typeof result.revision!=='number')throw new Error('save_failed')
    return result.revision
  },(status,nextRevision)=>{setState(status);setRevision(nextRevision)}))
  useEffect(()=>{
    queue.update(input.snapshot)
    if(!queue.dirty())return
    const timer=setTimeout(()=>{queue.flush().catch(()=>{})},input.delayMs??900)
    return()=>clearTimeout(timer)
  },[queue,input.snapshot,input.delayMs])
  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(queue.dirty()){event.preventDefault();event.returnValue=''}}
    const navigate=(event:MouseEvent)=>{
      const link=(event.target as Element).closest?.('a[href]') as HTMLAnchorElement|null
      if(!queue.dirty()||!link||event.button!==0||event.metaKey||event.ctrlKey||link.target==='_blank')return
      event.preventDefault();event.stopImmediatePropagation()
      queue.flush().then(()=>{window.location.href=link.href}).catch(()=>{})
    }
    window.addEventListener('beforeunload',warn)
    document.addEventListener('click',navigate,true)
    return()=>{window.removeEventListener('beforeunload',warn);document.removeEventListener('click',navigate,true)}
  },[queue])
  const flush=useCallback(()=>{queue.update(input.snapshot);return queue.flush()},[queue,input.snapshot])
  const retry=useCallback(()=>{void flush().catch(()=>{})},[flush])
  return {state,revision,retry,flush}
}
