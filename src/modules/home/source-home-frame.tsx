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
  if (!style) { style = document.createElement('style'); style.id = 'continuum-public-home-style'; style.textContent = '#nav-user-id,#navbar .nav-btn,#fab-dock,#chat-mini,#icode-mini{display:none!important}#navbar .nav-links a[data-page="guide"],#navbar .nav-links a[data-page="about"],#navbar .nav-links a[data-page="chat"],#navbar .nav-links a[data-page="memory"],#navbar .nav-links a[data-page="api"],#navbar .nav-links a[data-page="diy"]{display:none!important}#navbar .nav-links a[data-page="blog"],#navbar .nav-links a[data-page="letters"],#navbar .nav-links a[data-page="game"]{display:inline-block!important}#splash-orig .splash-skip{display:none!important}#public-enter-brand{display:inline-flex;margin-top:25px;padding:0 0 5px;border:0;border-bottom:1px solid rgba(224,236,252,.38);background:none;color:rgba(224,236,252,.86);font:300 12px Raleway,"Segoe UI",sans-serif;letter-spacing:.12em;cursor:pointer;text-shadow:0 1px 8px rgba(0,0,0,.58);pointer-events:auto}#public-enter-brand:hover{color:#fff;border-color:rgba(244,250,255,.82)}.source-public-definition{margin:70px 0 0;color:rgba(229,239,252,.86);font:300 13px "Noto Serif SC","Source Han Serif SC",serif;letter-spacing:.08em;text-shadow:0 1px 10px rgba(4,10,26,.72)}#gw-slot.gw-rippling #gw-ripple{opacity:1!important;mix-blend-mode:overlay!important}'; document.head.appendChild(style); }
  function route(page, href, label) { var el = document.querySelector('#navbar .nav-links a[data-page="'+page+'"]'); if (!el) return; el.textContent = label; el.setAttribute('href', href); el.onclick = function(ev) { ev.preventDefault(); window.parent.location.href = href; }; }
  var navBrand = document.querySelector('#navbar .nav-brand'); if (navBrand) { var mark = navBrand.querySelector('#ghost-icon'); navBrand.innerHTML = ''; if (mark) navBrand.appendChild(mark); navBrand.appendChild(document.createTextNode('KC')); }
  route('blog','/blog','Blog'); route('letters','/letters','Letters'); route('game','/room','Room');
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
  if (!style) { style = document.createElement('style'); style.id = 'continuum-public-mobile-style'; style.textContent = '#dw-name{font-family:var(--disp);letter-spacing:.06em}'; document.head.appendChild(style); }
  function external(selector, href) { document.querySelectorAll(selector).forEach(function(el) { if (el.dataset.continuumBound) return; el.dataset.continuumBound='1'; el.addEventListener('click', function(ev) { ev.preventDefault(); ev.stopPropagation(); window.parent.location.href=href; }, true); }); }
  external('#drawer .dw-item[data-page="blog"],#sec-profile-cal .sb-app[data-page="blog"]','/blog');
  external('#drawer .dw-item[data-page="letters"],#sec-profile-cal .sb-app[data-page="letters"]','/letters');
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
    <main className="source-home-frame">
      {!loaded ? <div className="source-home-frame-loading">Loading Continuum…</div> : null}
      <iframe key={mobile ? 'mobile' : 'desktop'} ref={frameRef} title="Keleoz Continuum Home" src={mobile ? '/reference/internal-beyond-mobile/index.html' : '/reference/internal-beyond/InternalBeyond.html'} />
    </main>
  )
}
