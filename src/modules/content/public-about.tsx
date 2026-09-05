/* eslint-disable @next/next/no-img-element -- These are already published, pre-generated media variants. */
import type { PublicContentDto } from './dto'
import type { PublicSiteConfig } from '@/modules/site-config/contracts'
import type { CSSProperties } from 'react'

export function PublicAbout({ page,settings }: { page: PublicContentDto | null;settings:PublicSiteConfig }) {
  const body = page?.exposure === 'full' ? page.bodyHtml : null
  const photos = settings.galleryUrls.map(src=>({src,alt:settings.name+' gallery'}))
  const summary = page?.summary || '一个持续生长的个人数字空间。阅读、记录、实验，也保留一些可以进入的房间。'
  return (
    <article className="source-about-card">
      <section className="source-about-identity" style={settings.coverUrl?{'--profile-cover':`url("${settings.coverUrl}")`} as CSSProperties:undefined}>
        <div className="source-about-avatar">{settings.avatarUrl?<img src={settings.avatarUrl} alt={settings.name}/>:settings.name.charAt(0)}</div>
        <h1 style={settings.nameColor==='theme'?undefined:{color:settings.nameColor==='black'?'#1a1a1a':'#ffffff'}}>{settings.name}</h1>
        <p>@KeleozContinuum</p>
      </section>
      <section className="source-about-bio">
        <p className="source-about-kicker">{settings.tagline}</p>
        <p style={{whiteSpace:'pre-wrap'}}>{settings.bio||summary}</p>
        {settings.customText?<p style={{whiteSpace:'pre-wrap'}}>{settings.customText}</p>:null}
        {body ? <div className="source-about-content" dangerouslySetInnerHTML={{ __html: body }} /> : null}
        {page?.exposure === 'summary' ? <small>完整介绍暂未公开</small> : null}
      </section>
      {photos.length ? <section className="source-about-gallery" aria-label="Profile gallery">{photos.map((photo, index) => <a href={photo.src} key={`${photo.src}-${index}`} target="_blank" rel="noreferrer"><img src={photo.src} alt={photo.alt} loading="lazy" /></a>)}</section> : null}
    </article>
  )
}
