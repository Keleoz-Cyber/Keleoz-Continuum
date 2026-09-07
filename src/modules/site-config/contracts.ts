import { z } from 'zod'
import { appearanceSchema,appearanceMediaIds,appearanceProjection } from './appearance'
export const siteConfigSchema=z.object({
  revision:z.number().int().nonnegative().default(0),
  name:z.string().trim().min(1).max(80).default('Keleoz'),
  bio:z.string().max(600).default('一个持续生长的个人数字空间。'),
  customText:z.string().max(500).default(''),
  nameColor:z.enum(['theme','black','white']).default('theme'),
  avatarId:z.uuid().nullable().default(null),coverId:z.uuid().nullable().default(null),galleryIds:z.array(z.uuid().nullable()).max(3).default([]),
  infernalAvatarId:z.uuid().nullable().default(null),infernalCoverId:z.uuid().nullable().default(null),infernalGalleryIds:z.array(z.uuid().nullable()).max(3).default([]),
  appearance:appearanceSchema.default(()=>appearanceSchema.parse({})),
  tagline:z.string().trim().min(1).max(120).default('A Personal Digital Space.'),
  introduction:z.string().max(300).default('一个持续生长的个人数字空间。'),
  theme:z.enum(['internal','infernal']).default('internal'),
  playlist:z.array(z.uuid()).max(30).default([]),
  roomOutfit:z.number().int().min(0).max(5).default(2),
})
export type SiteConfig=z.infer<typeof siteConfigSchema>
export function siteImageIds(config:SiteConfig){return [config.avatarId,config.coverId,...config.galleryIds,config.infernalAvatarId,config.infernalCoverId,...config.infernalGalleryIds,...appearanceMediaIds(config.appearance)].filter((id):id is string=>!!id)}
export function siteMediaIds(config:SiteConfig){return [...new Set([...siteImageIds(config),...config.playlist])]}
export function publicSiteProjection(input:unknown,media:Array<{id:string;originalName:string}>=[]){
  const config=siteConfigSchema.parse(input)
  return {...config,appearance:appearanceProjection(config.appearance),avatarUrl:config.avatarId?`/media/${config.avatarId}/card.webp`:null,coverUrl:config.coverId?`/media/${config.coverId}/large.webp`:null,galleryUrls:config.galleryIds.map(id=>id?`/media/${id}/large.webp`:''),infernalAvatarUrl:config.infernalAvatarId?`/media/${config.infernalAvatarId}/card.webp`:null,infernalCoverUrl:config.infernalCoverId?`/media/${config.infernalCoverId}/large.webp`:null,infernalGalleryUrls:config.infernalGalleryIds.map(id=>id?`/media/${id}/large.webp`:''),tracks:config.playlist.map(id=>({id,name:media.find(item=>item.id===id)?.originalName.replace(/\.[^.]+$/,'')||'Music',url:`/media/${id}/original`}))}
}
export type PublicSiteConfig=ReturnType<typeof publicSiteProjection>
