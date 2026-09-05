import { autosaveRuntime } from './autosave'

export const writerRuntime = autosaveRuntime + String.raw`
function installSourceWriter({container,prefix,getId,setId,isPrivate,clean,className,request,dbPut,stores}){
  if(!container)return;
  container.style.overflowY='auto';
  const fields=['title','subtitle','content','cat','format'].map(key=>document.getElementById(prefix+key));
  let attachments=[],active=false;
  const state=document.createElement('button');state.type='button';state.className=className;state.dataset.sourceSave='';state.style.marginTop='8px';state.setAttribute('aria-live','polite');container.appendChild(state);
  const read=()=>({values:fields.map(el=>el.value),attachments:JSON.parse(JSON.stringify(attachments))});
  const autosave=createSourceAutosave({read,
    write:async snapshot=>{
      const [title,subtitle,content,category,format]=snapshot.values;
      const id=getId()||'post_'+Date.now();setId(id);
      const previous=stores.posts.get(id);
      const post={id,title:title.trim(),subtitle:subtitle.trim(),content,category,format,attachments:snapshot.attachments,locked:previous?!!previous.locked:isPrivate(),created:previous?.created||Date.now()};
      await dbPut('posts',post);return post;
    },accept:post=>{setId(post.id)},
    status:(value,error)=>{state.dataset.state=value;state.textContent=({saving:'正在保存…',saved:getId()?'草稿已保存':'自动保存已开启',dirty:'等待保存…',error:'保存失败，点击重试'})[value];state.title=error?.message||'自动保存仅更新私人草稿，不会自动发布。';if(value==='saved')clean()}
  });
  state.onclick=()=>autosave.flush().catch(error=>toast(error.message));
  fields.forEach(el=>{el.addEventListener('input',()=>{if(active)autosave.change()});el.addEventListener('change',()=>{if(active)autosave.change()})});
  const guard=e=>{if(active&&autosave.dirty()){e.preventDefault();e.returnValue=''}};
  window.addEventListener('beforeunload',guard);window.parent.addEventListener('beforeunload',guard);
  const navigate=async event=>{const link=event.target.closest?.('a[href]');if(!active||!autosave.dirty()||!link||event.button!==0||event.ctrlKey||event.metaKey||link.target==='_blank')return;event.preventDefault();event.stopImmediatePropagation();try{await autosave.flush();active=false;window.parent.location.href=link.href}catch(error){toast(error.message)}};
  window.parent.document.addEventListener('click',navigate,true);
  window.addEventListener('pagehide',()=>{window.parent.removeEventListener('beforeunload',guard);window.parent.document.removeEventListener('click',navigate,true)});
  const publication=document.createElement('button');publication.type='button';publication.className=className;publication.textContent='发布设置';publication.style.marginTop='8px';
  publication.onclick=async()=>{if(publication.disabled)return;publication.disabled=true;try{await autosave.flush();if(!getId()){toast('请先写下内容。');return}active=false;window.parent.location.href='/studio/content/'+getId()+'/settings'}catch(error){toast(error.message)}finally{publication.disabled=false}};
  container.appendChild(publication);

  const media=document.createElement('details');media.style.marginTop='12px';const summary=document.createElement('summary');summary.textContent='附加媒体';if(prefix==='ed-')summary.className='rift-label';media.appendChild(summary);
  const hint=document.createElement('p');hint.className='rift-imp-hint';hint.dataset.mediaHint='';hint.textContent='媒体接在正文后。正文内的复杂排版可在发布设置中转为块编辑。';media.appendChild(hint);
  const picker=document.createElement('select');picker.className=prefix==='ed-'?'rift-select':'';picker.setAttribute('aria-label','选择附加媒体');media.appendChild(picker);
  const caption=document.createElement('input');caption.placeholder='说明 / Caption';caption.setAttribute('aria-label','媒体说明');caption.maxLength=2000;caption.style.cssText='width:100%;margin:8px 0';media.appendChild(caption);
  const add=document.createElement('button');add.type='button';add.className=className;add.textContent='添加媒体';media.appendChild(add);
  const upload=document.createElement('input');upload.type='file';upload.setAttribute('aria-label','上传附加媒体');upload.style.cssText='width:100%;margin:8px 0';media.appendChild(upload);
  const list=document.createElement('div');list.dataset.sourceAttachments='';media.appendChild(list);container.insertBefore(media,container.querySelector('.rift-stats')?.previousElementSibling||null);
  if(prefix==='ed-'){caption.className='rift-select';list.style.color='#3f5e8c'}
  let choices=[];
  const render=()=>{list.replaceChildren();attachments.forEach((node,index)=>{const row=document.createElement('div');row.style.cssText='margin:8px 0;overflow-wrap:anywhere';const label=document.createElement('span');label.textContent=node.attrs.caption||node.attrs.title||node.attrs.label||node.attrs.alt||'相册';row.appendChild(label);for(const [text,action] of [['↑',()=>{if(index){[attachments[index-1],attachments[index]]=[attachments[index],attachments[index-1]]}}],['↓',()=>{if(index<attachments.length-1){[attachments[index+1],attachments[index]]=[attachments[index],attachments[index+1]]}}],['移除',()=>attachments.splice(index,1)]]){const b=document.createElement('button');b.type='button';b.className=className;b.textContent=text;b.setAttribute('aria-label',text+' '+label.textContent);b.onclick=()=>{action();render();autosave.change()};row.appendChild(b)}list.appendChild(row)})};
  const refresh=async()=>{choices=await request('/api/studio/source-media');picker.replaceChildren();for(const item of choices){const option=document.createElement('option');option.value=item.id;option.textContent=item.originalName+' · '+item.kind;picker.appendChild(option)}add.disabled=!choices.length};
  media.addEventListener('toggle',()=>{if(media.open)refresh().catch(error=>toast(error.message))});
  const attach=item=>{if(attachments.length>=32){toast('最多附加 32 项媒体。');return}const text=caption.value.trim();const node=item.kind==='image'?{type:'continuumImage',attrs:{mediaId:item.id,alt:item.altText,caption:text,size:'content'}}:item.kind==='attachment'?{type:'continuumAttachment',attrs:{mediaId:item.id,label:item.originalName.slice(0,240),description:text}}:{type:item.kind==='audio'?'continuumAudio':'continuumVideo',attrs:{mediaId:item.id,title:item.originalName.slice(0,240),caption:text}};attachments.push(node);render();autosave.change()};
  add.onclick=()=>{const item=choices.find(item=>item.id===picker.value);if(item)attach(item)};
  upload.onchange=async()=>{const file=upload.files?.[0];if(!file)return;upload.disabled=true;try{const form=new FormData();form.set('file',file);form.set('altText',caption.value);const response=await fetch('/api/studio/media',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'上传失败');await refresh();const item=choices.find(item=>item.id===data.id);if(item){picker.value=item.id;attach(item)}}catch(error){toast(error.message)}finally{upload.disabled=false;upload.value=''}};
  return {flush:()=>active?autosave.flush():Promise.resolve(),reset:()=>{attachments=JSON.parse(JSON.stringify(stores.posts.get(getId())?.attachments||[]));active=true;render();autosave.reset()},close:()=>{active=false;autosave.reset()},dirty:()=>active&&autosave.dirty()};
}
`
