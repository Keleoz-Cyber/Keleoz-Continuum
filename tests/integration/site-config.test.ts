import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll,beforeEach,expect,it } from 'vitest'
import * as schema from '@/db/schema'
import { createTestPool } from '@/test/db'
import { createSiteConfigRepository } from '@/modules/site-config/repository'
import { siteConfigSchema } from '@/modules/site-config/contracts'
const pool=createTestPool(),repo=createSiteConfigRepository(drizzle(pool,{schema}))
beforeEach(()=>pool.query("delete from owner_source_records where store='_site'"))
afterAll(async()=>{await pool.query("delete from owner_source_records where store='_site'");await pool.end()})
it('publishes an explicit whitelist snapshot and rejects stale settings',async()=>{
  const initial=await repo.read();expect(initial.revision).toBe(0)
  await repo.save({...initial,name:'Published',roomOutfit:4})
  expect(await repo.read()).toMatchObject({name:'Published',revision:1,roomOutfit:4})
  await expect(repo.save(initial)).rejects.toThrow('site_config_conflict')
})
it('does not publish missing media',async()=>{
  await expect(repo.save(siteConfigSchema.parse({avatarId:'a2345678-1234-4234-8234-123456789012'}))).rejects.toThrow('invalid_site_media')
  expect((await repo.read()).revision).toBe(0)
})
it('rejects using a playlist audio object as an avatar even when both fields reference it',async()=>{
  const id='b2345678-1234-4234-8234-123456789012'
  await pool.query("insert into media_objects(id,storage_key,original_name,mime_type,byte_size,sha256,state) values($1,'site-qa-audio','site-qa.wav','audio/wav',44,'site-qa','ready')",[id])
  try{await expect(repo.save(siteConfigSchema.parse({avatarId:id,playlist:[id]}))).rejects.toThrow('invalid_site_media')}
  finally{await pool.query('delete from media_objects where id=$1',[id])}
})
