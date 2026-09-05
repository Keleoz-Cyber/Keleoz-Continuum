import { publicWebUrl, searchQuery } from '@/modules/web-search/contracts'

export const searchRuntime=String.raw`
const continuumSearchQuery=${searchQuery.toString()};
const continuumPublicWebUrl=${publicWebUrl.toString()};
async function continuumSearch(messages,signal){
  const query=continuumSearchQuery(messages);
  if(!query)return null;
  const response=await fetch('/api/studio/web-search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query}),signal});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'联网搜索失败。');
  return data;
}
function installDesktopSearch(){
  const wrap=original=>async function(cfg,messages,opts={}){
    if(!cfg.webSearch)return original(cfg,messages,opts);
    const state=opts._st||opts;
    if(!state.continuumSearchDone){
      state.continuumSearchDone=true;
      const ac=opts.abortController||new AbortController();state.ac=ac;
      try{
        const result=await continuumSearch(messages,ac.signal);
        ac.signal.throwIfAborted();
        if(result){state.continuumSearch=result;const record={query:result.query,results:result.results.map(r=>({title:r.title,url:r.url}))};if(opts.searchLog)opts.searchLog.push(record);if(opts.onSearch)opts.onSearch({phase:'results',...record})}
      }catch(error){state.continuumSearchDone=false;throw error}
      finally{if(state.ac===ac)state.ac=null}
    }
    if(state.stopped)throw new DOMException('已停止','AbortError');
    const withSearch=state.continuumSearch?[{role:'system',content:state.continuumSearch.context},...messages]:messages;
    return original({...cfg,webSearch:false},withSearch,opts);
  };
  _callApiChatStreamOnce=wrap(_callApiChatStreamOnce);
  _callApiChatOnce=wrap(_callApiChatOnce);
}
function installMobileSearch(){
  const original=callAIC;
  callAIC=async function(cfg,hist,sys,onDelta,signal,pa){
    const result=cfg.webSearch?await continuumSearch(hist,signal):null;
    const reply=await original({...cfg,webSearch:false},hist,result?sys+'\n\n'+result.context:sys,onDelta,signal,pa);
    if(result)reply.wsSearches=[{query:result.query,results:result.results.map(r=>({title:r.title,url:r.url}))}];
    return reply;
  };
  const card=searchCard;
  searchCard=function(record){const node=card(record),detail=node.querySelector('.ws-op-detail');if(detail){detail.textContent='';for(const r of record.results||[]){const url=continuumPublicWebUrl(r.url);if(!url)continue;const a=document.createElement('a');a.href=url;a.textContent=r.title||url;a.target='_blank';a.rel='noopener noreferrer';a.style.cssText='display:block;color:inherit';a.addEventListener('click',event=>event.stopPropagation());detail.appendChild(a)}}return node};
}
`
