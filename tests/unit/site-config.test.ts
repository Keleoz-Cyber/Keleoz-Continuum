import { expect,it } from 'vitest'
import { siteConfigSchema,publicSiteProjection } from '@/modules/site-config/contracts'
import { createMobileCharacterState } from '@/modules/character/mobile-state'
import { siteConfigScript } from '@/modules/site-config/source-patch'
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
