import { and,eq,inArray } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '@/db/schema'
import { ownerSourceRecords,mediaObjects } from '@/db/schema'
import { siteConfigSchema,siteMediaIds,type SiteConfig } from './contracts'
export function createSiteConfigRepository(database:NodePgDatabase<typeof schema>){
  const read=async()=>{
    const [record]=await database.select({value:ownerSourceRecords.value}).from(ownerSourceRecords).where(and(eq(ownerSourceRecords.store,'_site'),eq(ownerSourceRecords.key,'public')))
    return siteConfigSchema.parse(record?.value??{})
  }
  return {read,async save(input:SiteConfig){
    const next=siteConfigSchema.parse(input)
    return database.transaction(async tx=>{
      await tx.execute('select pg_advisory_xact_lock(7152034)')
      const [old]=await tx.select({value:ownerSourceRecords.value}).from(ownerSourceRecords).where(and(eq(ownerSourceRecords.store,'_site'),eq(ownerSourceRecords.key,'public')))
      if(siteConfigSchema.parse(old?.value??{}).revision!==next.revision)throw new Error('site_config_conflict')
      const ids=siteMediaIds(next)
      if(ids.length){
        const media=await tx.select({id:mediaObjects.id,mime:mediaObjects.mimeType,state:mediaObjects.state}).from(mediaObjects).where(inArray(mediaObjects.id,ids))
        const images=[next.avatarId,next.coverId,...next.galleryIds]
        for(const id of ids){const item=media.find(item=>item.id===id);if(!item||item.state!=='ready'||(images.includes(id)&&!item.mime.startsWith('image/'))||(next.playlist.includes(id)&&!item.mime.startsWith('audio/')))throw new Error('invalid_site_media')}
      }
      const value={...next,revision:next.revision+1}
      await tx.insert(ownerSourceRecords).values({store:'_site',key:'public',value}).onConflictDoUpdate({target:[ownerSourceRecords.store,ownerSourceRecords.key],set:{value,updatedAt:new Date()}})
      return value
    })
  }}
}
