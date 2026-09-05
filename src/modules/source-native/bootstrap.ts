// This runs inside the original classic script, before its original init().
// Presentation, editor, Chat, Memory, modal and floating-window functions remain upstream-owned.
import { writerRuntime } from './writer-runtime'
export const nativeBootstrap = String.raw`
${writerRuntime}
async function continuumNativeBoot(){
  const nativeFetch=window.fetch.bind(window);
  const request=async(url,body)=>{
    const response=await nativeFetch(url,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error==='draft_conflict'?'草稿已在另一个窗口更新，请重新打开后再编辑。':(typeof data.error==='string'?data.error:'保存失败，请重试。'));
    return data;
  };
  window.fetch=function(url,options){
    const target=new URL(typeof url==='string'?url:url.url,location.href);
    if(target.origin!==location.origin){
      let body;try{body=JSON.parse(options&&options.body||'{}')}catch(e){}
      if(body&&Array.isArray(body.messages))return nativeFetch('/api/studio/source-ai',{...options,headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({messages:body.messages,stream:!!body.stream})});
      return Promise.reject(new Error('此能力尚未接入站点服务。'));
    }
    return nativeFetch(url,options);
  };
  const requestedType=new URLSearchParams(location.search).get('type');
  const contentType=['blog','project','moment','page'].includes(requestedType)?requestedType:'blog';
  const [records,posts]=await Promise.all([request('/api/studio/source-records'),request('/api/studio/source-posts?type='+contentType)]);
  const stores={};
  for(const r of records){if(r.store[0]!=='_')(stores[r.store]||(stores[r.store]=new Map())).set(r.key,r.value)}
  stores.posts=new Map(posts.map(p=>[p.id,p]));
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const config=v=>v?{...v,provider:'openai',apiKey:'server-managed',endpoint:'https://continuum.invalid/v1/chat/completions',model:v.model||'Site AI',tools:false,webSearch:false}:v;
  openDB=async()=>({});
  dbGetAll=async(s)=>[...(stores[s]||new Map()).values()].map(v=>clone(s==='apiConfigs'?config(v):v));
  dbGet=async(s,k)=>{const v=(stores[s]||new Map()).get(String(k));return clone(s==='apiConfigs'?config(v):v)};
  dbGetByIndex=async(s,idx,val)=>(await dbGetAll(s)).filter(v=>v[idx==='byFriend'?'friendId':idx==='byProject'?'projectId':idx]===val);
  dbPut=async(s,d)=>{
    if(s==='posts'){
      const previous=stores.posts.get(d.id);
      if(previous&&previous.richDocument)throw new Error('这篇文章含结构化内容，请从发布设置打开块编辑器。');
      const saved=await request('/api/studio/source-posts',{...d,type:previous?.type||contentType,revision:previous&&previous.revision});
      stores.posts.delete(d.id);Object.assign(d,saved);stores.posts.set(saved.id,clone(d));
      window.__continuumSavedPost=saved.id;return;
    }
    const key=String(s==='categories'?d.name:d.id);
    const saved=await request('/api/studio/source-records',{op:'put',store:s,key,value:d});
    (stores[s]||(stores[s]=new Map())).set(key,saved);
  };
  dbDelete=async(s,k)=>{
    if(s==='posts'){window.parent.location.href='/studio?section=manage';return}
    await request('/api/studio/source-records',{op:'delete',store:s,key:String(k)});
    if(stores[s])stores[s].delete(String(k));
  };
  dbPutAll=async(s,rows)=>{for(const r of rows)await dbPut(s,r);return rows.length};
  dbClear=async()=>{throw new Error('请从管理页面执行数据清理。')};
  let writer;
  const appendMedia=(id,container)=>{document.getElementById('continuum-post-media')?.remove();const html=stores.posts.get(id)?.attachmentHtml;if(html&&container){const media=document.createElement('div');media.id='continuum-post-media';media.innerHTML=html;container.appendChild(media)}};
  const mediaStyle=document.createElement('style');mediaStyle.textContent='#continuum-post-media img,#continuum-post-media video{max-width:100%;height:auto}#continuum-post-media audio{width:100%}#continuum-post-media figure{margin:20px 0}#continuum-post-media figcaption{font-size:.8rem}#continuum-post-media .continuum-gallery{display:flex;gap:8px}#continuum-post-media .continuum-gallery>figure{flex:1;min-width:0}';document.head.appendChild(mediaStyle);
  _ibGuardCheck=()=>{};_ibGuardInit=()=>{};
  const configureApiForm=()=>{
    document.getElementById('api-provider').value='openai';
    document.getElementById('api-key').value='server-managed';
    document.getElementById('api-endpoint').value='https://continuum.invalid/v1/chat/completions';
    document.getElementById('api-model').value='Site AI';
    ['api-provider','api-key','api-endpoint','api-model'].forEach(id=>{const el=document.getElementById(id);const group=el&&(el.closest('.api-form-group')||el.parentElement);if(group)group.style.display='none'});
  };
  const addApi=addNewApi,editOriginalApi=editApi,saveApi=saveCurrentApi;
  addNewApi=function(){addApi();configureApiForm();document.getElementById('api-editor-title').textContent='添加同行者'};
  editApi=function(id){editOriginalApi(id);configureApiForm()};
  saveCurrentApi=async function(){configureApiForm();return saveApi()};
  const originalInit=init;
  await originalInit();
  const preloader=document.getElementById('preloader');if(preloader)preloader.style.display='none';
  const chatTools=document.querySelector('.chat-full-header>div:last-child');
  if(chatTools){const setup=document.createElement('button');setup.className='chat-tool-btn';setup.textContent='同行者设置';setup.onclick=()=>navTo('api');chatTools.appendChild(setup);const floating=document.createElement('button');floating.className='chat-tool-btn';floating.textContent='浮动窗口';floating.onclick=()=>openChatPanel();chatTools.appendChild(floating)}
  const apiIntro=document.querySelector('#page-api .module-intro-desc');if(apiIntro)apiIntro.textContent='设置同行者的名字、头像、关系、提示词和记忆权限。AI 服务与额度由站点统一管理。';
  document.title='Keleoz Continuum';
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('app').classList.add('visible');
  document.getElementById('bg-internal-img').classList.add('active');
  const options=new URLSearchParams(location.search), page=options.get('page')||'blog';
  navTo(page);
  const bar=document.querySelector('#blog-edit-view .rift-sidebar');
  writer=installSourceWriter({container:bar,prefix:'ed-',getId:()=>editingPostId,setId:id=>{editingPostId=id},isPrivate:()=>diaryMode,clean:()=>{editorDirty=false},className:'btn',request,dbPut,stores});
  const originalSave=savePost,originalClose=closeEditor;
  savePost=async()=>{try{await writer.flush();return await originalSave()}catch(error){toast(error.message)}};
  closeEditor=()=>{writer.close();return originalClose()};
  const openOriginalEditor=openEditor;
  openEditor=async(id)=>{
    const p=id?stores.posts.get(id):null;
    if(p&&p.richDocument){window.parent.location.href='/studio/content/'+id+'/advanced';return}
    await writer.flush();await openOriginalEditor(id);writer.reset();
  };
  if(options.get('edit'))await openEditor(options.get('edit')==='new'?undefined:options.get('edit'));
  deletePost=function(){window.parent.location.href='/studio?section=manage'};
  document.querySelectorAll('.rift-imp-hint:not([data-media-hint])').forEach(el=>el.textContent='可直接将文本或 Markdown 文件拖入正文区。');
  const visibility=document.querySelector('#mem-f-visibility option[value="public"]');if(visibility)visibility.textContent='所有同行者可见';
  const beyond=document.getElementById('chat-beyond-toggle');if(beyond)beyond.onclick=()=>window.parent.location.href='/moments';
  const originalViewPost=viewPost;
  viewPost=async(id)=>{if(stores.posts.get(id)?.richDocument){window.parent.location.href='/studio/content/'+id+'/preview';return}window.__continuumSavedPost=id;await originalViewPost(id);appendMedia(id,document.getElementById('post-view-body')?.parentElement)};
  if(page==='chat'&&apiConfigs.length)await selectFriend(apiConfigs[0].id);
  const originalNav=navTo;
  navTo=function(next){
    if(next==='home'){window.parent.location.href='/';return}
    if(next==='blog'||next==='chat'||next==='memory'||next==='api'){originalNav(next);return}
    toast('此入口尚未接入站点，请使用顶栏的对应页面。');
  };
  window.addEventListener('unhandledrejection',e=>{toast(e.reason&&e.reason.message||'操作失败，请重试。')});
  window.__continuumNativeReady=true;
}
void continuumNativeBoot().catch(function(error){document.body.innerHTML='';const message=document.createElement('p');message.textContent='页面加载失败：'+error.message;document.body.appendChild(message)});
`

// Mobile has its own authoritative UI and cursor helpers, sharing the same server records.
export const nativeMobileBootstrap = nativeBootstrap.slice(0, nativeBootstrap.indexOf('  _ibGuardCheck=')).replace('continuumNativeBoot', 'continuumMobileBoot') + String.raw`
  dbEach=async(s,cb)=>{for(const item of await dbGetAll(s))cb(item)};
  dbCount=async(s)=>(await dbGetAll(s)).length;
  dbDeleteMany=async(s,keys)=>{for(const key of keys)await dbDelete(s,key)};
  dbLastByFriend=async(fid)=>(await dbGetByIndex('chatMessages','byFriend',fid)).filter(m=>!m.threadId).sort((a,b)=>b.timestamp-a.timestamp)[0]||null;
  dbPageByFriend=async(fid,beforeKey,limit,threadId)=>{
    _pgThread=threadId||null;
    const rows=(await dbGetByIndex('chatMessages','byFriend',fid)).filter(m=>threadId?m.threadId===threadId:!m.threadId).sort((a,b)=>b.timestamp-a.timestamp);
    const offset=beforeKey?rows.findIndex(m=>m.id===beforeKey)+1:0;
    const items=rows.slice(offset,offset+limit);
    return {items:items.slice().reverse(),nextBefore:items[items.length-1]?.id||null,more:offset+limit<rows.length};
  };
  _lkBoot=async()=>{document.getElementById('lockscr')?.remove();document.getElementById('lk-preveil')?.remove()};
  const originalEditor=blogOpenEditor;
  blogOpenEditor=async(id)=>{
    if(id&&stores.posts.get(id)?.richDocument){window.parent.location.href='/studio/content/'+id+'/advanced';return}
    if(writer)await writer.flush();await originalEditor(id);if(writer)writer.reset();
  };
  const originalAset=openAset;
  const originalViewMobile=viewPostM;
  viewPostM=async id=>{if(stores.posts.get(id)?.richDocument){window.parent.location.href='/studio/content/'+id+'/preview';return}await originalViewMobile(id);appendMedia(id,document.querySelector('#m-post-view .pv-body'))};
  openAset=function(c){originalAset(c);document.getElementById('aset-provider').value='openai';document.getElementById('aset-key').value='server-managed';document.getElementById('aset-model').value='Site AI';document.getElementById('aset-endpoint').value='https://continuum.invalid/v1/chat/completions';document.getElementById('aset-key').closest('.set-card').style.display='none'};
  window.__continuumShowMobile=async()=>{
    await _lkBoot();document.title='Keleoz Continuum';
    document.getElementById('ib-splash')?.remove();
    const query=new URLSearchParams(location.search),target=query.get('page')||'blog';
    navTo(target);
    writer=installSourceWriter({container:document.querySelector('#sub-blog-editor .ed-page'),prefix:'m-ed-',getId:()=>bEditingId,setId:id=>{bEditingId=id},isPrivate:()=>bDiaryMode,clean:()=>{},className:'btn primary',request,dbPut,stores});
    let replaySave=false;
    const saveButton=document.getElementById('m-ed-save');
    saveButton.addEventListener('click',async event=>{if(replaySave){replaySave=false;return}event.stopImmediatePropagation();try{await writer.flush();replaySave=true;saveButton.click()}catch(error){toast(error.message)}},true);
    const originalCloseSub=closeSub;
    closeSub=function(id){if(id==='sub-blog-editor'){writer.flush().then(()=>{writer.close();originalCloseSub(id)}).catch(error=>toast(error.message));return}return originalCloseSub(id)};
    if(query.get('edit'))await blogOpenEditor(query.get('edit')==='new'?undefined:query.get('edit'));
    const originalNav=navTo;
    navTo=function(page){if(page==='profile'){window.parent.location.href='/';return}if(['chat','memory','blog','api'].includes(page)){originalNav(page);return}const routes={letters:'/letters',beyond:'/moments',guide:'/search'};if(routes[page])window.parent.location.href=routes[page];else toast('此入口尚未接入站点。')};
    window.__continuumNativeReady=true;
  };
}
window.continuumStoreReady=continuumMobileBoot();
`
