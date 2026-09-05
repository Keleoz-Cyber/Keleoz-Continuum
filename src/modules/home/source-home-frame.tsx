'use client'

import { useEffect, useRef, useState } from 'react'

const PUBLIC_HOME_PATCH = `
  document.title = 'Keleoz Continuum';
  function text(selector, html) { var el = document.querySelector(selector); if (el) el.innerHTML = html; }
  text('#home-subtitle', 'A place of waking in the mist.<br>All traces are kept here, waiting to be read.');
  text('#home-title', '<span class="t-internal">Keleoz</span><span class="home-rule"></span><span class="t-beyond">Continuum</span>');
  text('#home-credit', '<span class="home-credit-label">A Personal Digital Space.</span><span class="home-credit-amp"> · </span><span class="home-credit-ver">一个持续生长的个人数字空间。</span>');
  text('#splash-ib .home-subtitle', 'A personal digital space.<br>All traces are kept here, waiting to continue.');
  text('#splash-ib .home-title', '<span class="t-internal">Keleoz</span><span class="home-rule"></span><span class="t-beyond">Continuum</span>');
  text('#splash-orig .splash-title', 'Welcome to <span class="ib-hl">Keleoz</span> Continuum');
  text('#splash-orig .splash-desc', '这是一个<span class="splash-white">面向公开访问</span>的个人数字空间。');
  text('#splash-orig .splash-desc2', '你可以在这里阅读书写、探索房间，<br>也可以留下来信，让这个空间继续生长。');
  text('#splash-orig .splash-note', '公开内容由 Owner 发布，私人来信不会被公开。');
  var mode = document.getElementById('ib-mode-toggle');
  if (mode) { mode.innerHTML = '<span class="splash-sign-name">Keleoz</span><span class="splash-sign-dot"> / </span><span class="splash-sign-claude">Continuum</span>'; if (mode.parentElement && mode.parentElement.firstChild && mode.parentElement.firstChild.nodeType === 3) mode.parentElement.firstChild.nodeValue = ''; }
  var origButtons = document.querySelector('#splash-orig .splash-buttons');
  if (origButtons) { origButtons.innerHTML = '<button type="button" class="splash-action-btn" id="public-enter">进入空间</button>'; var enter = document.getElementById('public-enter'); if (enter) enter.onclick = function() { window.enterSite && enterSite(); }; }
  var ib = document.querySelector('#splash-ib');
  if (ib && !document.getElementById('public-enter-brand')) { var definition = document.createElement('p'); definition.className = 'source-public-definition'; definition.textContent = '一个持续生长的个人数字空间。'; ib.appendChild(definition); var b = document.createElement('button'); b.id = 'public-enter-brand'; b.type = 'button'; b.className = 'splash-skip public-enter-brand'; b.textContent = 'Enter / 进入'; b.onclick = function() { window.enterSite && enterSite(); }; ib.appendChild(b); }
  var style = document.getElementById('continuum-public-home-style');
  if (!style) { style = document.createElement('style'); style.id = 'continuum-public-home-style'; style.textContent = '#nav-user-id,#navbar .nav-btn,#fab-dock,#chat-mini,#icode-mini{display:none!important}#navbar .nav-links li:has(>a[data-page="diy"]){display:none!important}#navbar .nav-links a[data-page="blog"],#navbar .nav-links a[data-page="guide"],#navbar .nav-links a[data-page="chat"],#navbar .nav-links a[data-page="memory"],#navbar .nav-links a[data-page="about"],#navbar .nav-links a[data-page="letters"],#navbar .nav-links a[data-page="game"],#navbar .nav-links a[data-page="api"]{display:inline-block!important}#splash-orig .splash-skip{display:none!important}#public-enter-brand{display:inline-flex;margin-top:25px;padding:0 0 5px;border:0;border-bottom:1px solid rgba(224,236,252,.38);background:none;color:rgba(224,236,252,.86);font:300 12px Raleway,"Segoe UI",sans-serif;letter-spacing:.12em;cursor:pointer;text-shadow:0 1px 8px rgba(0,0,0,.58);pointer-events:auto}#public-enter-brand:hover{color:#fff;border-color:rgba(244,250,255,.82)}.source-public-definition{margin:70px 0 0;color:rgba(229,239,252,.86);font:300 13px "Noto Serif SC","Source Han Serif SC",serif;letter-spacing:.08em;text-shadow:0 1px 10px rgba(4,10,26,.72)}'; document.head.appendChild(style); }
  ['diy'].forEach(function(page){var link=document.querySelector('#navbar .nav-links a[data-page="'+page+'"]');if(link&&link.parentElement)link.parentElement.style.display='none';});
  function route(page, href, label) { var el = document.querySelector('#navbar .nav-links a[data-page="'+page+'"]'); if (!el) return; el.textContent = label; el.setAttribute('href', href); el.onclick = function(ev) { ev.preventDefault(); window.parent.location.href = href; }; }
  var navBrand = document.querySelector('#navbar .nav-brand'); if (navBrand) { var mark = navBrand.querySelector('#ghost-icon'); navBrand.innerHTML = ''; if (mark) navBrand.appendChild(mark); navBrand.appendChild(document.createTextNode('KC')); }
  route('blog','/blog','Blog'); route('guide','/projects','Projects'); route('chat','/chat','Chat'); route('memory','/memory','Memory'); route('about','/about','About'); route('game','/room','Room'); route('api','/search','Search'); route('letters','/letters','Letters');
  var navList=document.querySelector('#navbar .nav-links'); if(navList){['blog','guide','chat','memory','about','game','api','letters'].forEach(function(page){var link=navList.querySelector('a[data-page="'+page+'"]');if(link&&link.parentElement)navList.appendChild(link.parentElement);});}
  if(navList){
    [['moments','/moments','Moments'],['timeline','/timeline','Timeline']].forEach(function(item){var li=document.createElement('li'),a=document.createElement('a');a.dataset.page='continuum-'+item[0];a.href=item[1];a.textContent=item[2];a.onclick=function(e){e.preventDefault();window.parent.location.href=item[1]};li.appendChild(a);navList.appendChild(li)});
    ['blog','guide','continuum-moments','continuum-timeline','about','game','api','letters','chat','memory'].forEach(function(page){var a=navList.querySelector('a[data-page="'+page+'"]');if(a)navList.appendChild(a.parentElement)});
    var studio=document.createElement('a');studio.href='/studio';studio.textContent='Studio';studio.style.cssText='margin-left:auto;color:#233e6c;font-size:.65rem';studio.onclick=function(e){e.preventDefault();window.parent.location.href='/studio'};document.getElementById('navbar').appendChild(studio);
  }
  var warning = document.getElementById('ib-guard-overlay'); if (warning) warning.remove();
  var observer = new MutationObserver(function() { var w = document.getElementById('ib-guard-overlay'); if (w) w.remove(); var game = document.getElementById('game-mini'); if (game && !game.dataset.continuumBound) { game.dataset.continuumBound='1'; game.onclick=function(ev){ev.preventDefault();window.parent.location.href='/room';}; } });
  observer.observe(document.body,{childList:true,subtree:true});
  if (window.ibModeToggle && !document.querySelector('#splash-swap.ib-mode')) window.ibModeToggle();
  if (window.toggleTheme && !window.toggleTheme.__continuumWrapped) { var originalToggle = window.toggleTheme; var wrapped = function(){ originalToggle.apply(window, arguments); window.setTimeout(function(){ text('#home-title','<span class="t-internal">Keleoz</span><span class="home-rule"></span><span class="t-beyond">Continuum</span>'); text('#home-credit','<span class="home-credit-label">A Personal Digital Space.</span><span class="home-credit-amp"> · </span><span class="home-credit-ver">一个持续生长的个人数字空间。</span>'); },1200); }; wrapped.__continuumWrapped=true; window.toggleTheme=wrapped; }
  if (new URLSearchParams(window.parent.location.search).get('openMusic') === '1') window.setTimeout(function(){document.getElementById('music-mini')?.click();},900);
`

const PUBLIC_MOBILE_PATCH = `
  document.title = 'Keleoz Continuum';
  function removePublicLock() { var lock = document.getElementById('lockscr'); if (lock) { lock.remove(); try { if (window._lkClockT) clearInterval(window._lkClockT); } catch (e) {} } document.documentElement.classList.remove('sp-dark'); }
  function applyBranding() { removePublicLock(); var name = document.getElementById('dw-name'); if (name && name.textContent !== 'Keleoz') name.textContent = 'Keleoz'; var title = document.getElementById('tb-title'); if (title && title.textContent !== 'Home') title.textContent = 'Home'; var profile = document.getElementById('pf-name'); if (profile && (!profile.textContent || profile.textContent.trim() === '—' || profile.textContent.trim() === 'Sui')) profile.textContent = 'Keleoz'; }
  applyBranding();
  var lockObserver = new MutationObserver(applyBranding); lockObserver.observe(document.documentElement,{childList:true,subtree:true}); window.setTimeout(function(){ lockObserver.disconnect(); applyBranding(); },4000);
  var style = document.getElementById('continuum-public-mobile-style');
  if (!style) { style = document.createElement('style'); style.id = 'continuum-public-mobile-style'; style.textContent = '#dw-name{font-family:var(--disp);letter-spacing:.06em}#drawer .dw-item[data-page="chat"],#drawer .dw-item[data-page="icode"],#drawer .dw-item[data-page="api"],#drawer .dw-item[data-page="diy"],#sec-profile-cal .sb-app[data-page="chat"],#sec-profile-cal .sb-app[data-page="icode"],#sec-profile-cal .sb-app[data-page="data"],#sec-profile-cal .sb-app[data-page="visual"],#sec-profile-cal .sb-app[data-page="diy"],#sb-calapp,#sb-setapp,#sb-frdapp{display:none!important}'; document.head.appendChild(style); }
  function ensureProjectTile() { if (document.querySelector('#sec-profile-cal .sb-app[data-page="projects"]')) return; var blog = document.querySelector('#sec-profile-cal .sb-app[data-page="blog"]'); if (!blog || !blog.parentNode) return; var template = document.createElement('template'); template.innerHTML = '<button class="sb-app" data-page="projects" data-dk="app:projects"><span class="sb-ic"><svg viewBox="0 0 24 24"><path d="M4 6.5h6l1.8 2H20v10.5H4z"/><path d="M7 13h10M7 16h7"/></svg></span><span class="sb-t">项目</span></button>'; blog.parentNode.insertBefore(template.content.firstElementChild, blog.nextSibling); if (window.DK_NAMES) window.DK_NAMES['app:projects']='项目'; }
  ensureProjectTile();
  function ensureTeaTile() { if (document.querySelector('#sec-profile-cal .sb-app[data-page="tea"]')) return; var music = document.getElementById('sb-musicapp'); if (!music || !music.parentNode) return; var template = document.createElement('template'); template.innerHTML = '<button class="sb-app" data-page="tea" data-dk="app:tea"><span class="sb-ic"><svg viewBox="0 0 24 24"><path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 5.5c0 1-.8 1.4-.8 2.3M11 4.5c0 1-.8 1.4-.8 2.3"/></svg></span><span class="sb-t">茶歇</span></button>'; music.parentNode.insertBefore(template.content.firstElementChild, music.nextSibling); if (window.DK_NAMES) window.DK_NAMES['app:tea']='茶歇'; }
  ensureTeaTile();
  function ensureStoryTile() { if (document.querySelector('#sec-profile-cal .sb-app[data-page="story"]')) return; var tea = document.querySelector('#sec-profile-cal .sb-app[data-page="tea"]'); if (!tea || !tea.parentNode) return; var template = document.createElement('template'); template.innerHTML = '<button class="sb-app" data-page="story" data-dk="app:story"><span class="sb-ic"><svg viewBox="0 0 24 24"><path d="M5 4.5h5.2A2.8 2.8 0 0 1 13 7.3V20a3.2 3.2 0 0 0-3-2H5z"/><path d="M19 4.5h-5.2A2.8 2.8 0 0 0 11 7.3V20a3.2 3.2 0 0 1 3-2h5z"/></svg></span><span class="sb-t">故事</span></button>'; tea.parentNode.insertBefore(template.content.firstElementChild, tea.nextSibling); if (window.DK_NAMES) window.DK_NAMES['app:story']='故事'; }
  ensureStoryTile();
  function ensureTarotTile() { if (document.querySelector('#sec-profile-cal .sb-app[data-page="tarot"]')) return; var story = document.querySelector('#sec-profile-cal .sb-app[data-page="story"]'); if (!story || !story.parentNode) return; var template = document.createElement('template'); template.innerHTML = '<button class="sb-app" data-page="tarot" data-dk="app:tarot"><span class="sb-ic"><svg viewBox="0 0 24 24"><path d="M12 3l2.3 5.2L20 10l-4.4 3.7L17 20l-5-3-5 3 1.4-6.3L4 10l5.7-1.8z"/></svg></span><span class="sb-t">占卜</span></button>'; story.parentNode.insertBefore(template.content.firstElementChild, story.nextSibling); if (window.DK_NAMES) window.DK_NAMES['app:tarot']='占卜'; }
  ensureTarotTile();
  function ensureCharacterTile() { if (document.querySelector('#sec-profile-cal .sb-app[data-page="character"]')) return; var tarot = document.querySelector('#sec-profile-cal .sb-app[data-page="tarot"]'); if (!tarot || !tarot.parentNode) return; var template = document.createElement('template'); template.innerHTML = '<button class="sb-app" data-page="character" data-dk="app:character"><span class="sb-ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M6 20a6 6 0 0 1 12 0M8.5 13.5l-2.5-2M15.5 13.5l2.5-2"/></svg></span><span class="sb-t">角色</span></button>'; tarot.parentNode.insertBefore(template.content.firstElementChild, tarot.nextSibling); if (window.DK_NAMES) window.DK_NAMES['app:character']='角色'; }
  ensureCharacterTile();
  var timelineTile=document.getElementById('sb-calapp'); if(timelineTile){var timelineText=timelineTile.querySelector('.sb-t');if(timelineText)timelineText.textContent='时间线';if(window.DK_NAMES)window.DK_NAMES['app:calendar']='时间线';}
  var searchTile=document.querySelector('#sec-profile-cal .sb-app[data-page="guide"]'); if(searchTile){var searchText=searchTile.querySelector('.sb-t');if(searchText)searchText.textContent='搜索';if(window.DK_NAMES)window.DK_NAMES['app:guide']='搜索';}
  var timelineDrawer=document.querySelector('#drawer .dw-item[data-page="memory"]'); if(timelineDrawer){var timelineEn=timelineDrawer.querySelector('.dw-en'),timelineCn=timelineDrawer.querySelector('.dw-cn');if(timelineEn)timelineEn.textContent='Memory';if(timelineCn)timelineCn.textContent='记忆';}
  var searchDrawer=document.querySelector('#drawer .dw-item[data-page="guide"]'); if(searchDrawer){var searchEn=searchDrawer.querySelector('.dw-en'),searchCn=searchDrawer.querySelector('.dw-cn');if(searchEn)searchEn.textContent='Search';if(searchCn)searchCn.textContent='搜索';}
  if (typeof window.deskApplyLayout==='function') Promise.resolve(window.deskApplyLayout()).catch(function(){});
  function external(selector, href) { document.querySelectorAll(selector).forEach(function(el) { if (el.dataset.continuumBound) return; el.dataset.continuumBound='1'; el.addEventListener('click', function(ev) { ev.preventDefault(); ev.stopPropagation(); window.parent.location.href=href; }, true); }); }
  external('#drawer .dw-item[data-page="blog"],#sec-profile-cal .sb-app[data-page="blog"]','/blog');
  external('#sec-profile-cal .sb-app[data-page="projects"]','/projects');
  var momentsTile=document.querySelector('#sec-profile-cal .sb-app[data-page="beyond"] .sb-t'); if(momentsTile) momentsTile.textContent='动态';
  external('#drawer .dw-item[data-page="beyond"],#sec-profile-cal .sb-app[data-page="beyond"]','/moments');
  external('#sec-profile-cal .sb-app[data-page="space"]','/about');
  external('#drawer .dw-item[data-page="letters"],#sec-profile-cal .sb-app[data-page="letters"]','/letters');
  external('#sec-profile-cal .sb-app[data-page="tea"]','/tea');
  external('#sec-profile-cal .sb-app[data-page="story"]','/story');
  external('#sec-profile-cal .sb-app[data-page="tarot"]','/tarot');
  external('#sec-profile-cal .sb-app[data-page="character"]','/character');
  external('#drawer .dw-item[data-page="memory"],#sec-profile-cal .sb-app[data-page="memory"]','/memory');
  external('#drawer .dw-item[data-page="chat"],#sec-profile-cal .sb-app[data-page="chat"]','/chat');
  external('#sb-calapp','/timeline');
  if(style)style.textContent+='#drawer .dw-item[data-page="chat"],#sec-profile-cal .sb-app[data-page="chat"],#sb-calapp{display:flex!important}';
  external('#drawer .dw-item[data-page="guide"],#sec-profile-cal .sb-app[data-page="guide"]','/search');
  try { if (typeof DOCKS !== 'undefined' && Array.isArray(DOCKS.profile)) { DOCKS.profile = DOCKS.profile.filter(function(item){ return item.k !== 'api' && item.k !== 'set'; }); if (typeof renderDock === 'function') renderDock(); } } catch (e) {}
  if (new URLSearchParams(window.parent.location.search).get('openMusic') === '1') window.setTimeout(function(){ document.getElementById('sb-musicapp')?.click(); },900);
`

export function SourceHomeFrame() {
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const sync = () => setMobile(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const frameNode = frameRef.current
    if (!frameNode) return
    const frame: HTMLIFrameElement = frameNode
    function patchSource() {
      const sourceWindow = frame.contentWindow
      const sourceDocument = frame.contentDocument
      if (!sourceWindow || !sourceDocument || sourceDocument.getElementById('continuum-public-home-patch') || sourceDocument.getElementById('continuum-public-mobile-patch')) return
      const script = sourceDocument.createElement('script')
      script.id = mobile ? 'continuum-public-mobile-patch' : 'continuum-public-home-patch'
      script.textContent = mobile ? PUBLIC_MOBILE_PATCH : PUBLIC_HOME_PATCH
      sourceDocument.body.appendChild(script)
      setLoaded(true)
    }
    frame.addEventListener('load', patchSource)
    if (frame.contentDocument?.readyState === 'complete') patchSource()
    return () => frame.removeEventListener('load', patchSource)
  }, [mobile])

  return (
    <section className="source-home-frame" aria-label="Continuum scene">
      {!loaded ? <div className="source-home-frame-loading">Loading Continuum…</div> : null}
      <iframe key={mobile ? 'mobile' : 'desktop'} ref={frameRef} title="Keleoz Continuum Home" src={mobile ? '/reference/internal-beyond-mobile/index.html' : '/reference/internal-beyond/InternalBeyond.html?continuum-gloss=2'} />
    </section>
  )
}
