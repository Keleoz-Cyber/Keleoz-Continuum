import type { PublicSiteConfig } from './contracts'
export function siteConfigScript(config:PublicSiteConfig,mobile:boolean){
  const json=JSON.stringify(config).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029')
  return `
  var site=${json};
  var hiddenSiteTracks=new Set(),readLocal=dbGetAll,deleteLocal=dbDelete;
  dbGetAll=async function(store){var rows=await readLocal(store);if(store!=='music')return rows;var curated=site.tracks.map((t,i)=>({id:'site-'+t.id,name:t.name,data:t.url,album:'Keleoz Continuum',addedAt:-1000+i})).filter(t=>!hiddenSiteTracks.has(t.id));return curated.concat(rows.filter(t=>!String(t.id||'').startsWith('site-')))};
  dbDelete=async function(store,id){if(store==='music'&&String(id).startsWith('site-')){hiddenSiteTracks.add(id);return}return deleteLocal(store,id)};
  function applySiteCopy(){
    document.querySelectorAll('#home-credit .home-credit-label').forEach(el=>el.textContent=site.tagline);
    document.querySelectorAll('#home-credit .home-credit-ver,.source-public-definition').forEach(el=>el.textContent=site.introduction);
  }
  applySiteCopy();
  ${mobile?`
  var originalGet=dbGet;dbGet=async function(store,key){if(store==='about'&&key==='main')return {id:'main',name:site.name,nameColor:site.nameColor,bio:site.bio,customText:site.customText,avatar:site.avatarUrl||'',bgImage:site.coverUrl||'',galleryImages:site.galleryUrls,infAvatar:site.infernalAvatarUrl||'',infBgImage:site.infernalCoverUrl||'',infGalleryImages:site.infernalGalleryUrls};return originalGet(store,key)};
  var sourceLoadMP=loadMP;
  loadMP=async function(){var prefs=await sourceLoadMP();prefs.ui={...prefs.ui,...site.appearance.ui};prefs.desk=JSON.parse(JSON.stringify(site.appearance.desk));prefs.deskDeco=site.appearance.decorations;_mp=prefs;return prefs};
  loadMP().then(async function(){
    _mbgs={id:'mobileBgs',...site.appearance.backgrounds};
    await _uiApply();_uiApplyBg();await deskApplyLayout();
    window.__continuumSiteApplied=true;
  });
  var privateEdit=document.getElementById('pf-set-btn');if(privateEdit)privateEdit.style.display='none';
  if(typeof renderProfile==='function')renderProfile();
  _pwLoad().then(function(){if(_pw.idx<0&&_pw.list.length){_pw.idx=0;var audio=_pwA();audio.preload='none';audio.src=_pwSrc(_pw.list[0]);}_pwPaint();});
  var originalTheme=applyTheme,installing=true;applyTheme=function(dark){originalTheme(dark);if(!installing)try{localStorage.setItem('continuum_theme',dark?'infernal':'internal')}catch(e){}};
  var preferred=site.theme;try{preferred=localStorage.getItem('continuum_theme')||preferred}catch(e){};applyTheme(preferred==='infernal');installing=false;
  var space=document.getElementById('sb-spaceapp');if(space)space.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();window.parent.location.href='/about'},true);
  `:`
  _musicLoadLibraryD().then(function(){if(currentTrackIdx<0&&playlist.length){currentTrackIdx=0;audioEl.preload='none';audioEl.src=_musicAudioSrcD(playlist[0]);}renderPlaylist();updateNowPlaying();});
  var originalPlay=togglePlay;togglePlay=function(){if(currentTrackIdx>=0)initAudioContext();return originalPlay()};
  var originalTheme=window.toggleTheme,installing=true;window.toggleTheme=function(){var remember=!installing;originalTheme();setTimeout(function(){applySiteCopy();if(remember)try{localStorage.setItem('continuum_theme',document.body.classList.contains('theme-infernal')?'infernal':'internal')}catch(e){}},1300)};
  var preferred=site.theme;try{preferred=localStorage.getItem('continuum_theme')||preferred}catch(e){};if((preferred==='infernal')!==document.body.classList.contains('theme-infernal'))window.toggleTheme();installing=false;
  `}
  ${mobile?'':'window.__continuumSiteApplied=true;'}
  `
}
