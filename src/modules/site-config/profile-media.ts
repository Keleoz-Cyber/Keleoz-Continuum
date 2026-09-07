import type { PublicSiteConfig } from './contracts'
export function profileMedia(config:PublicSiteConfig,dark:boolean){
  const gallery=Array.from({length:Math.max(config.galleryUrls.length,config.infernalGalleryUrls.length)},(_,i)=>(dark?config.infernalGalleryUrls[i]:'')||config.galleryUrls[i]||'').filter(Boolean)
  return {avatar:dark?(config.infernalAvatarUrl||config.avatarUrl):config.avatarUrl,cover:dark?(config.infernalCoverUrl||config.coverUrl):config.coverUrl,gallery}
}
