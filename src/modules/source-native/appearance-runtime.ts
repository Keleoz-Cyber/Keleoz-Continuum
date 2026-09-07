export const desktopAppearanceRuntime=String.raw`
async function installDesktopAppearance(){
  const root=document.getElementById('page-diy');
  root.querySelector('.module-intro-desc').textContent='沿用原版素材位置。上传先保存为私人草稿，点击底部发布后才应用到公开网站。未设置的位置继续使用原版素材。';
  root.querySelectorAll('.api-section,#ib-mcp-card,#ib-net-card,#ib-sandbox-card').forEach(el=>el.style.display='none');
  const cards=[...root.querySelectorAll('.glass-card')];
  const host=cards.find(el=>el.textContent.includes('其他配置说明'));
  const draft=(await dbGet('apiSettings','desktopAppearance'))||{id:'desktopAppearance'};
  const rows=[['internal','Internal 网站背景'],['infernal','Infernal 网站背景'],['canvas','Welcome 雾窗背景'],['tarot','Tarot 桌布'],['portrait','Tea / Story 站点同行者立绘']];
  for(const [key,label] of rows){
    const row=document.createElement('div');row.className='api-form-group';row.style.marginTop='20px';
    const title=document.createElement('label');title.textContent=label;row.appendChild(title);
    const preview=document.createElement('img');preview.style.cssText='display:block;max-width:100%;max-height:150px;margin:8px 0';preview.alt=label;if(draft[key])preview.src=draft[key];else preview.hidden=true;row.appendChild(preview);
    const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp,image/avif';input.setAttribute('aria-label',label);row.appendChild(input);
    const clear=document.createElement('button');clear.className='btn';clear.textContent='恢复原版素材';clear.type='button';row.appendChild(clear);
    const save=async value=>{draft[key]=value;await dbPut('apiSettings',draft);preview.hidden=!value;if(value)preview.src=value;toast('已保存草稿，发布后对外生效。')};
    input.onchange=async()=>{const file=input.files?.[0];if(!file)return;input.disabled=true;try{const form=new FormData();form.append('file',file);form.append('altText',label);const response=await fetch('/api/studio/media',{method:'POST',body:form});const result=await response.json();if(!response.ok)throw new Error(result.error||'上传失败');await save('/media/'+result.id+'/large.webp')}catch(error){toast(error.message)}finally{input.disabled=false;input.value=''}};
    clear.onclick=()=>save(null).catch(error=>toast(error.message));host.appendChild(row);
  }
}
`
