type Guard=()=>Promise<unknown>
const guards=new Set<Guard>()
export function registerLeaveGuard(guard:Guard){guards.add(guard);return()=>{guards.delete(guard)}}
function activeGuards():Guard[]{
  const all=[...guards]
  if(typeof document!=='undefined'){
    const frame=document.querySelector<HTMLIFrameElement>('.native-owner-frame')
    const win=frame?.contentWindow as (Window&{__continuumFlush?:Guard})|null
    if(win?.__continuumFlush)all.push(()=>win.__continuumFlush!())
  }
  return all
}
export async function flushLeaveGuards(){await Promise.all(activeGuards().map(guard=>guard()))}

/** Restore the current history entry before awaiting a save, then replay the intended traversal. */
export function installHistorySaveGuard(onError:(error:unknown)=>void,onSaved:()=>void=()=>{}){
  const key='__continuumPosition'
  const browserPosition=()=>((window as Window&{navigation?:{currentEntry?:{index:number}}}).navigation?.currentEntry?.index)
  let position=browserPosition()??Number(history.state?.[key]??0),intent:number|null=null,replay:number|null=null,saving=false
  const push=history.pushState.bind(history),replace=history.replaceState.bind(history)
  const pushTagged:History['pushState']=function(data,title,url){position=(browserPosition()??position)+1;push({...data,[key]:position},title,url)}
  const replaceTagged:History['replaceState']=function(data,title,url){replace({...data,[key]:position},title,url)}
  replaceTagged(history.state,'')
  history.pushState=pushTagged;history.replaceState=replaceTagged
  const pop=(event:PopStateEvent)=>{
    const next=browserPosition()??event.state?.[key]
    if(typeof next!=='number')return
    if(replay===next){replay=null;position=next;return}
    if(intent===null&&!activeGuards().length){position=next;return}
    if(intent===null&&next===position)return
    event.stopImmediatePropagation()
    if(intent===null)intent=next
    if(next!==position){history.go(position-next);return}
    if(saving)return
    saving=true
    void flushLeaveGuards().then(()=>{
      const destination=intent!;intent=null;saving=false;replay=destination;onSaved();history.go(destination-position)
    },error=>{intent=null;saving=false;onError(error)})
  }
  window.addEventListener('popstate',pop,true)
  // Native hash links also create same-document entries; route them through the tagged API.
  const hashClick=(event:MouseEvent)=>{
    if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return
    const link=(event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null
    if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return
    const target=new URL(link.href,location.href)
    if(target.origin!==location.origin||target.pathname!==location.pathname||target.search!==location.search||!target.hash)return
    event.preventDefault();history.pushState(history.state,'',target.href)
    try{document.getElementById(decodeURIComponent(target.hash.slice(1)))?.scrollIntoView()}catch{}
  }
  document.addEventListener('click',hashClick)
  return()=>{
    window.removeEventListener('popstate',pop,true)
    document.removeEventListener('click',hashClick)
    if(history.pushState===pushTagged)history.pushState=push
    if(history.replaceState===replaceTagged)history.replaceState=replace
  }
}
