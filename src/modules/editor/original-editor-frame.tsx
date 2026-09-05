'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/core'
import { EditorContent } from '@tiptap/react'

function subscribe(fn:()=>void){const query=matchMedia('(max-width:900px)');query.addEventListener('change',fn);return()=>query.removeEventListener('change',fn)}
type Slots={doc:Document;body:HTMLElement;tools:HTMLElement;mobile:boolean}
export function OriginalEditorFrame(props:{
  editor:Editor|null;title:string;subtitle:string;category:string;categories:string[];
  onMetadata:(key:'title'|'subtitle'|'category',value:string)=>void;
  onSave:(destination:string)=>Promise<void>;onImport:(file:File)=>Promise<void>;
  onCommand:(command:string)=>void;tools:ReactNode;entryId:string;characters:number;lines:number;size:number;
}){
  const mobile=useSyncExternalStore(subscribe,()=>matchMedia('(max-width:900px)').matches,()=>false)
  const [slots,setSlots]=useState<Slots|null>(null)
  useEffect(()=>{
    if(!slots)return
    const {doc,mobile:phone}=slots,prefix=phone?'m-ed-':'ed-'
    for(const [key,value] of [['title',props.title],['subtitle',props.subtitle],['category',props.category]] as const){
      const field=doc.getElementById(prefix+(key==='category'?'cat':key)) as HTMLInputElement|HTMLSelectElement
      if(key==='category'){
        const values=['',...new Set([...props.categories,props.category].filter(Boolean))]
        if(JSON.stringify(Array.from((field as HTMLSelectElement).options).map(o=>o.value))!==JSON.stringify(values))field.replaceChildren(...values.map(value=>{const option=doc.createElement('option');option.value=value;option.textContent=value||'未分类';return option}))
      }
      if(field.value!==value)field.value=value
      field.oninput=()=>props.onMetadata(key,field.value)
      field.onchange=()=>props.onMetadata(key,field.value)
    }
    const stats=phone?['m-ed-chars','m-ed-lines','m-ed-size']:['rift-chars','rift-lines','rift-size']
    stats.forEach((id,index)=>{const el=doc.getElementById(id);if(el)el.textContent=[String(props.characters),String(props.lines),props.size.toFixed(1)+' KB'][index]})
    const format=doc.getElementById(prefix+'format') as HTMLSelectElement
    format.innerHTML='<option>块文档</option>';format.disabled=true
    doc.querySelectorAll<HTMLElement>('[data-source-command]').forEach(button=>{
      button.onmousedown=event=>event.preventDefault()
      button.onclick=()=>props.onCommand(button.dataset.sourceCommand!)
    })
    const save=()=>props.onSave('/studio')
    const back=doc.querySelector<HTMLElement>(phone?'[data-subback]':'[data-source-action="exitEditor"]')
    const done=doc.querySelector<HTMLElement>(phone?'#m-ed-save':'[data-source-action="savePost"]')
    if(back)back.onclick=()=>{void save()};if(done)done.onclick=()=>{void save()}
    const file=doc.getElementById('ed-imp-file') as HTMLInputElement|null
    const importer=doc.querySelector<HTMLElement>('[data-source-action="edImportPick"]')
    if(importer&&file){importer.onclick=()=>file.click();file.accept='.txt,.md,.markdown';file.onchange=()=>{if(file.files?.[0])void props.onImport(file.files[0]);file.value=''}}
    const date=doc.getElementById('rift-date');if(date){const now=new Date();date.textContent=now.getFullYear()+'.'+String(now.getMonth()+1).padStart(2,'0')+'.'+String(now.getDate()).padStart(2,'0')}
    doc.querySelectorAll('.rift-imp-hint').forEach(el=>el.textContent='导入文本或 Markdown；导入会追加到当前正文。')
    doc.querySelectorAll('.source-editor-tools button').forEach(el=>el.classList.add('btn'))
  },[slots,props])
  useEffect(()=>{if(slots&&props.editor){const id=requestAnimationFrame(()=>props.editor?.view.updateRoot());return()=>cancelAnimationFrame(id)}},[slots,props.editor])
  const visibleSlots=slots?.mobile===mobile?slots:null
  return <>
    <iframe key={mobile?'mobile':'desktop'} title="原版块文档工作空间" className={`native-owner-frame${mobile?' native-mobile':''}`} src={`/api/studio/source-editor-document?mobile=${mobile?'1':'0'}`} onLoad={event=>{
      const doc=event.currentTarget.contentDocument
      if(!doc||!doc.getElementById(mobile?'m-ed-content':'ed-content'))return
      const textarea=doc.getElementById(mobile?'m-ed-content':'ed-content')!
      const body=doc.createElement('div');body.className=(mobile?'ed-body-l':'rift-content')+' source-block-body';textarea.replaceWith(body)
      const tools=doc.createElement('div');tools.className='source-editor-tools'
      const container=doc.querySelector(mobile?'.ed-page':'.rift-sidebar')!;container.appendChild(tools)
      setSlots({doc,body,tools,mobile})
    }}/>
    {visibleSlots?createPortal(<EditorContent editor={props.editor}/>,visibleSlots.body):null}
    {visibleSlots?createPortal(props.tools,visibleSlots.tools):null}
  </>
}
