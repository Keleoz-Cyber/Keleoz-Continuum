'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { PublicSiteConfig } from '@/modules/site-config/contracts'
import { SourceHomeFrame } from './source-home-frame'
import { internalNavigationTarget } from './internal-navigation'
import { flushLeaveGuards, installHistorySaveGuard } from './leave-guards'
import { loadingFeedbackCss } from './loading-feedback'

const PublishSettings=createContext<(settings:PublicSiteConfig,openMusic?:boolean)=>void>(()=>{})
export function HomeSceneSettings({settings,openMusic=false}:{settings:PublicSiteConfig;openMusic?:boolean}){
  const publish=useContext(PublishSettings)
  useEffect(()=>publish(settings,openMusic),[publish,settings,openMusic])
  return null
}
export function PersistentScene({children}:{children:React.ReactNode}){
  const pathname=usePathname(),router=useRouter(),home=pathname==='/'
  const [settings,setSettings]=useState<PublicSiteConfig|null>(null),[playerOpen,setPlayerOpen]=useState(false),[pending,setPending]=useState<PublicSiteConfig|null>(null)
  const [navigationError,setNavigationError]=useState('')
  const host=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null)
  const currentConfig=useRef<PublicSiteConfig|null>(null)
  const closePlayer=useCallback(()=>{setPlayerOpen(false);trigger.current?.focus()},[])
  const publish=useCallback((next:PublicSiteConfig,openMusic=false)=>{
    if(!currentConfig.current){currentConfig.current=next;setSettings(next)}
    else if(currentConfig.current.revision!==next.revision)setPending(next)
    if(openMusic)setPlayerOpen(true)
  },[])
  useEffect(()=>{
    const navigate=(href:string)=>{
      const target=internalNavigationTarget(href,window.location.href)
      if(!target)return false
      if((target==='/?openMusic=1'||target==='/music')&&settings){setPlayerOpen(true);return true}
      void flushLeaveGuards().then(()=>{setNavigationError('');setPlayerOpen(false);router.push(target)},()=>setNavigationError('尚未保存成功，已留在当前页面。请重试保存后再离开。'))
      return true
    }
    window.__continuumNavigate=navigate
    const musicClick=(e:MouseEvent)=>{
      if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||!settings)return
      const a=(e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null
      if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return
      const target=internalNavigationTarget(a.href,window.location.href)
      if(target==='/?openMusic=1'||target==='/music'){e.preventDefault();e.stopPropagation();setPlayerOpen(true)}
    }
    const click=(e:MouseEvent)=>{
      if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return
      const a=(e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null
      if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return
      const href=a.getAttribute('href')||''
      // Next Links handle themselves; ordinary source links reach this bubbling listener.
      if(internalNavigationTarget(href,window.location.href)){e.preventDefault();navigate(href)}
    }
    document.addEventListener('click',click)
    document.addEventListener('click',musicClick,true)
    return()=>{document.removeEventListener('click',click);document.removeEventListener('click',musicClick,true);if(window.__continuumNavigate===navigate)delete window.__continuumNavigate}
  },[router,settings])
  useEffect(()=>installHistorySaveGuard(()=>setNavigationError('尚未保存成功，已留在当前页面。请重试保存后再离开。'),()=>setNavigationError('')),[])
  useEffect(()=>{
    if(!playerOpen)return
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPlayerOpen(false);trigger.current?.focus()}}
    window.addEventListener('keydown',key)
    return()=>window.removeEventListener('keydown',key)
  },[playerOpen])
  const offstage=!home&&!playerOpen
  return <PublishSettings.Provider value={publish}>
    <div ref={host} className={`persistent-scene${offstage?' is-offstage':''}${playerOpen&&!home?' is-player-overlay':''}`} aria-hidden={offstage} inert={offstage} role={playerOpen&&!home?'dialog':undefined} aria-modal={playerOpen&&!home?true:undefined} aria-label={playerOpen&&!home?'音乐播放器':undefined}>
      {settings?<SourceHomeFrame key={settings.revision} settings={settings} playerOnly={playerOpen&&!home} requestPlayer={playerOpen} onPlayerClosed={closePlayer}/>:home?<section className="source-home-frame" aria-busy="true"><style>{loadingFeedbackCss}</style><div className="source-home-frame-loading"><p className="source-loading-title">Now Loading…</p><div className="continuum-loading-track" role="progressbar" aria-label="首页正在加载"><span/></div><p className="source-loading-caption" role="status">正在准备资源与画面</p></div></section>:null}
      {playerOpen&&!home?<button autoFocus className="persistent-music-close" onClick={closePlayer}>收起播放器 ×</button>:null}
    </div>
    <div inert={playerOpen&&!home}>{children}</div>
    {!home&&settings?<button ref={trigger} hidden={playerOpen} className="persistent-music-trigger" onClick={()=>setPlayerOpen(true)}>♫ 音乐</button>:null}
    {pending&&home?<button className="persistent-config-notice" onClick={()=>{currentConfig.current=pending;setSettings(pending);setPending(null)}}>站点配置已更新，点击应用（会停止当前音乐）</button>:null}
    {navigationError?<p className="persistent-config-notice" role="alert">{navigationError}</p>:null}
  </PublishSettings.Provider>
}
declare global { interface Window { __continuumNavigate?:(href:string)=>boolean } }
