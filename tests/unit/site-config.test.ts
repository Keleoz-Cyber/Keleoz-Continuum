import { expect,it } from 'vitest'
import { siteConfigSchema,publicSiteProjection,siteMediaIds } from '@/modules/site-config/contracts'
import { createMobileCharacterState } from '@/modules/character/mobile-state'
import { siteConfigScript } from '@/modules/site-config/source-patch'
import { appearanceSchema,appearanceProjection } from '@/modules/site-config/appearance'
import { profileMedia } from '@/modules/site-config/profile-media'
it('serializes public copy as data and seeds the original final music-library adapter without autoplay',()=>{
  const script=siteConfigScript(publicSiteProjection({name:'</script><script>bad</script>'}),false)
  expect(script).not.toContain('</script>')
  expect(()=>new Function(script)).not.toThrow()
  expect(script).toContain('_musicLoadLibraryD()')
  expect(script).not.toContain('.play()')
  expect(()=>new Function(siteConfigScript(publicSiteProjection({}),true))).not.toThrow()
})
it('uses the site outfit only when the visitor has no saved state',()=>{
  const initial=createMobileCharacterState(null,4)
  expect(initial.outfitIdx).toBe(4)
  expect(createMobileCharacterState(initial.sourceState,2).outfitIdx).toBe(4)
})
it('provides source-compatible defaults and only projects explicitly public fields',()=>{
  const config=siteConfigSchema.parse({})
  expect(config).toMatchObject({name:'Keleoz',theme:'internal',roomOutfit:2,playlist:[]})
  const result=publicSiteProjection({...config,apiKey:'secret',birthday:'private',email:'private'})
  expect(JSON.stringify(result)).not.toMatch(/secret|birthday|email/)
})
it('rejects arbitrary external media URLs, invalid outfits and oversized galleries',()=>{
  expect(siteConfigSchema.safeParse({avatarId:'https://evil.test/a.svg'}).success).toBe(false)
  expect(siteConfigSchema.safeParse({roomOutfit:8}).success).toBe(false)
  expect(siteConfigSchema.safeParse({galleryIds:Array(4).fill('a2345678-1234-4234-8234-123456789012')}).success).toBe(false)
})
it('retains independent Infernal media and includes it in deletion protection',()=>{
  const id='a2345678-1234-4234-8234-123456789012'
  const config=siteConfigSchema.parse({infernalAvatarId:id,infernalCoverId:id,infernalGalleryIds:[id]})
  expect(publicSiteProjection(config)).toMatchObject({infernalAvatarUrl:`/media/${id}/card.webp`,infernalGalleryUrls:[`/media/${id}/large.webp`]})
  expect(siteMediaIds(config)).toContain(id)
})
it('publishes only visual settings and preserves source layout and decoration shapes',()=>{
  const safe=appearanceSchema.parse({ui:{deskLayout:'classic',panelAlpha:80,zcIcon:'light',apiKey:'private',deskMate:'solo'},desk:{order:['app:blog','music'],hidden:['music'],pages:{'app:blog':2}},perAi:{secret:true},decorations:[{id:'dd_1',kind:'text',text:'一段公开文字',fid:'private-friend'}]})
  expect(safe.ui).toMatchObject({deskLayout:'classic',panelAlpha:80,zcIcon:'light'})
  expect(JSON.stringify(safe)).not.toMatch(/private|perAi/)
  expect(appearanceProjection(safe).decorations[0]).toMatchObject({kind:'text',text:'一段公开文字',imgs:[],who:'me'})
  expect(appearanceSchema.safeParse({ui:{accColor:'red; background:url(https://evil)'}}).success).toBe(false)
  expect(appearanceProjection(appearanceSchema.parse({backgrounds:{chat:'a2345678-1234-4234-8234-123456789012'}})).backgrounds.chatBg).toBe('')
})
it('uses Internal media only when corresponding Infernal slots are unset',()=>{
  const id='a2345678-1234-4234-8234-123456789012'
  const base=publicSiteProjection({avatarId:id,coverId:id,galleryIds:[id]})
  expect(profileMedia(base,true)).toEqual(profileMedia(base,false))
  const inf='b2345678-1234-4234-8234-123456789012'
  const mixed=publicSiteProjection({galleryIds:[id,id],infernalGalleryIds:[null,inf]})
  expect(profileMedia(mixed,true).gallery).toEqual([`/media/${id}/large.webp`,`/media/${inf}/large.webp`])
})
