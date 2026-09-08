'use client'
import { PUBLIC_MOBILE_PATCH } from './mobile-public-patch'

import { useEffect, useRef, useState } from 'react'
import type { PublicSiteConfig } from '@/modules/site-config/contracts'
import { siteConfigScript } from '@/modules/site-config/source-patch'
import { loadingFeedbackCss } from './loading-feedback'

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
    [['moments','/moments','Moments'],['timeline','/timeline','Timeline'],['calendar','/calendar','Calendar']].forEach(function(item){var li=document.createElement('li'),a=document.createElement('a');a.dataset.page='continuum-'+item[0];a.href=item[1];a.textContent=item[2];a.onclick=function(e){e.preventDefault();window.parent.location.href=item[1]};li.appendChild(a);navList.appendChild(li)});
    ['blog','guide','continuum-moments','continuum-timeline','about','game','api','letters','chat','memory','continuum-calendar'].forEach(function(page){var a=navList.querySelector('a[data-page="'+page+'"]');if(a)navList.appendChild(a.parentElement)});
    var studio=document.createElement('a');studio.href='/studio';studio.textContent='Studio';studio.style.cssText='margin-left:auto;color:#233e6c;font-size:.65rem';studio.onclick=function(e){e.preventDefault();window.parent.location.href='/studio'};document.getElementById('navbar').appendChild(studio);
  }
  var warning = document.getElementById('ib-guard-overlay'); if (warning) warning.remove();
  var observer = new MutationObserver(function() { var w = document.getElementById('ib-guard-overlay'); if (w) w.remove(); var game = document.getElementById('game-mini'); if (game && !game.dataset.continuumBound) { game.dataset.continuumBound='1'; game.onclick=function(ev){ev.preventDefault();window.parent.location.href='/room';}; } });
  observer.observe(document.body,{childList:true,subtree:true});
  if (window.ibModeToggle && !document.querySelector('#splash-swap.ib-mode')) window.ibModeToggle();
  if (window.toggleTheme && !window.toggleTheme.__continuumWrapped) { var originalToggle = window.toggleTheme; var wrapped = function(){ originalToggle.apply(window, arguments); window.setTimeout(function(){ text('#home-title','<span class="t-internal">Keleoz</span><span class="home-rule"></span><span class="t-beyond">Continuum</span>'); text('#home-credit','<span class="home-credit-label">A Personal Digital Space.</span><span class="home-credit-amp"> · </span><span class="home-credit-ver">一个持续生长的个人数字空间。</span>'); },1200); }; wrapped.__continuumWrapped=true; window.toggleTheme=wrapped; }
  if (new URLSearchParams(window.parent.location.search).get('openMusic') === '1') window.setTimeout(function(){document.getElementById('music-mini')?.click();},900);
`


export function SourceHomeFrame({settings}:{settings:PublicSiteConfig}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const [loadedSurface, setLoadedSurface] = useState<string | null>(null)
  const [slowSurface, setSlowSurface] = useState<string | null>(null)
  const [mobile, setMobile] = useState<boolean | null>(null)
  const surface = mobile === null ? null : mobile ? 'mobile' : 'desktop'
  const loaded = surface !== null && loadedSurface === surface

  useEffect(() => {
    if (!surface || loaded) return
    const timer = window.setTimeout(() => setSlowSurface(surface), 12000)
    return () => window.clearTimeout(timer)
  }, [surface, loaded])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const sync = () => { setLoadedSurface(null); setSlowSurface(null); setMobile(query.matches) }
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
      if (!sourceDocument || sourceDocument.location.pathname !== (mobile ? '/reference/internal-beyond-mobile/index.html' : '/reference/internal-beyond/InternalBeyond.html')) return
      if (!sourceWindow || !sourceDocument || sourceDocument.getElementById('continuum-public-home-patch') || sourceDocument.getElementById('continuum-public-mobile-patch')) return
      const script = sourceDocument.createElement('script')
      script.id = mobile ? 'continuum-public-mobile-patch' : 'continuum-public-home-patch'
      script.textContent = 'window.__continuumPublishedName='+JSON.stringify(settings.name).replaceAll('<','\\u003c')+';' + (mobile ? PUBLIC_MOBILE_PATCH.replaceAll("'Keleoz'",'window.__continuumPublishedName') : PUBLIC_HOME_PATCH) + siteConfigScript(settings,mobile === true)
      sourceDocument.body.appendChild(script)
      setLoadedSurface(mobile ? 'mobile' : 'desktop')
    }
    frame.addEventListener('load', patchSource)
    if (frame.contentDocument?.readyState === 'complete') patchSource()
    return () => frame.removeEventListener('load', patchSource)
  }, [mobile,settings])

  return (
    <section className="source-home-frame" data-default-theme={settings.theme} aria-label="Continuum scene" aria-busy={!loaded}>
      <style>{loadingFeedbackCss}</style>
      {!loaded ? <div className="source-home-frame-loading">
        <p className="source-loading-title">Now Loading…</p>
        <div className="continuum-loading-track" role="progressbar" aria-label="首页正在加载" aria-valuetext="正在准备资源与画面"><span /></div>
        <p className="source-loading-caption" role="status">{slowSurface === surface && surface ? '加载时间较长，请稍候或重试。' : '正在准备资源与画面'}</p>
        {slowSurface === surface && surface ? <button type="button" onClick={() => window.location.reload()}>重新加载</button> : null}
      </div> : null}
      {mobile === null ? null : <iframe key={mobile ? 'mobile' : 'desktop'} ref={frameRef} title="Keleoz Continuum Home" src={mobile ? '/reference/internal-beyond-mobile/index.html?continuum-local=1' : '/reference/internal-beyond/InternalBeyond.html?continuum-gloss=2'} />}
    </section>
  )
}
