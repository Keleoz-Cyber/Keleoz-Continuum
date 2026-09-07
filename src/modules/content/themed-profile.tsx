'use client'
/* eslint-disable @next/next/no-img-element -- Published optimized media variants. */
import { useSyncExternalStore,type CSSProperties,type ReactNode } from 'react'
import type { PublicSiteConfig } from '@/modules/site-config/contracts'
import { profileMedia } from '@/modules/site-config/profile-media'

function subscribe(callback:()=>void){window.addEventListener('storage',callback);return()=>window.removeEventListener('storage',callback)}
export function ThemedProfile({settings,children}:{settings:PublicSiteConfig;children:ReactNode}){
  const theme=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem('continuum_theme')||settings.theme}catch{return settings.theme}},()=>settings.theme)
  const media=profileMedia(settings,theme==='infernal')
  return <article className="source-about-card" data-profile-theme={theme}>
    <section className="source-about-identity" style={media.cover?{'--profile-cover':`url("${media.cover}")`} as CSSProperties:undefined}>
      <div className="source-about-avatar">{media.avatar?<img src={media.avatar} alt={settings.name}/>:settings.name.charAt(0)}</div>
      <h1 style={settings.nameColor==='theme'?undefined:{color:settings.nameColor==='black'?'#1a1a1a':'#ffffff'}}>{settings.name}</h1><p>@KeleozContinuum</p>
    </section>
    {children}
    {media.gallery.length?<section className="source-about-gallery" aria-label="Profile gallery">{media.gallery.map((src,i)=><a href={src} key={`${src}-${i}`} target="_blank" rel="noreferrer"><img src={src} alt={settings.name+' gallery'} loading="lazy"/></a>)}</section>:null}
  </article>
}
