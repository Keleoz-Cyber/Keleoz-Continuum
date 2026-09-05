'use server'
import { and,eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db/client'
import { ownerSourceRecords } from '@/db/schema'
import { requireOwner } from '@/modules/auth/dal'
import { mediaService } from '@/modules/media/runtime'
import { siteConfigRepository } from './runtime'
import { siteConfigSchema } from './contracts'
function refresh(){for(const path of ['/','/about','/moments','/room','/character','/studio/settings'])revalidatePath(path)}
export async function saveSiteConfig(form:FormData){
  await requireOwner()
  const current=await siteConfigRepository.read()
  const next=siteConfigSchema.parse({...current,revision:Number(form.get('revision')),tagline:form.get('tagline'),introduction:form.get('introduction'),theme:form.get('theme'),roomOutfit:Number(form.get('roomOutfit')),playlist:form.getAll('playlist')})
  try{await siteConfigRepository.save(next)}catch{redirect('/studio/settings?error=save')}
  refresh();redirect('/studio/settings?saved=1')
}
async function imageId(value:unknown,label:string){
  if(!value)return null
  if(typeof value!=='string')throw new Error('Invalid profile image')
  const local=value.match(/^\/media\/([0-9a-f-]{36})\/(?:thumb|card|large)\.(?:webp|avif)$/i)
  if(local)return z.uuid().parse(local[1])
  if(value.length>14_000_000)throw new Error('Profile image is too large')
  const data=value.match(/^data:(image\/(?:png|jpeg|webp|avif|gif));base64,([a-zA-Z0-9+/=\r\n]+)$/)
  if(!data)throw new Error('Only uploaded images can be published')
  const image=await mediaService.uploadImage({bytes:Buffer.from(data[2],'base64'),declaredMimeType:data[1],originalName:`profile-${label}.${data[1].split('/')[1]}`,altText:label})
  return image.id
}
export async function publishSourceProfile(){
  await requireOwner()
  const current=await siteConfigRepository.read()
  const [record]=await db.select().from(ownerSourceRecords).where(and(eq(ownerSourceRecords.store,'about'),eq(ownerSourceRecords.key,'main')))
  const profile=record?.value??{}
  try{
    const fields=z.object({name:z.string().trim().min(1).max(80),bio:z.string().max(600).default(''),customText:z.string().max(500).default(''),nameColor:z.enum(['theme','black','white']).default('theme')}).parse(profile)
    const gallery=Array.isArray(profile.galleryImages)?profile.galleryImages.slice(0,3):[]
    const [avatarId,coverId,...galleryIds]=await Promise.all([imageId(profile.avatar,'avatar'),imageId(profile.bgImage,'cover'),...gallery.map((value,index)=>imageId(value,`gallery-${index+1}`))])
    await siteConfigRepository.save({...current,...fields,bio:profile.bioPrivate?'':fields.bio,avatarId,coverId,galleryIds:galleryIds.filter((id):id is string=>!!id)})
  }catch{redirect('/studio/profile?error=publish')}
  refresh();redirect('/studio/settings?profile=published')
}
