import 'server-only'
import { db } from '@/db/client'
import { eq,inArray,and } from 'drizzle-orm'
import { mediaObjects } from '@/db/schema'
import { createSiteConfigRepository } from './repository'
import { publicSiteProjection } from './contracts'
export const siteConfigRepository=createSiteConfigRepository(db)
let lastKnownPublic=publicSiteProjection({})
export async function getPublicSiteConfig(){
  try{
    const config=await siteConfigRepository.read()
    const media=config.playlist.length?await db.select({id:mediaObjects.id,originalName:mediaObjects.originalName}).from(mediaObjects).where(and(inArray(mediaObjects.id,config.playlist),eq(mediaObjects.state,'ready'))):[]
    lastKnownPublic=publicSiteProjection(config,media)
  }catch{console.warn('Public site configuration unavailable; using last known public defaults.')}
  return lastKnownPublic
}
