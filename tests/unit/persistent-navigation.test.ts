import { expect,it } from 'vitest'
import { internalNavigationTarget } from '@/modules/home/internal-navigation'
import { adaptSourceNavigation } from '@/modules/home/source-navigation'
import { nativeBootstrap,nativeMobileBootstrap } from '@/modules/source-native/bootstrap'
it('only soft-navigates known same-origin page routes, not downloads, APIs or unsafe URLs',()=>{
  const base='https://keleoz.com/blog'
  for(const url of ['/blog/hello','/history','/studio/write','/?openMusic=1','/room'])expect(internalNavigationTarget(url,base)).toBe(url)
  for(const url of ['https://evil.test/blog','javascript:alert(1)','/api/studio/export','/media/abc/original','/reference/internal-beyond/InternalBeyond.html','#note','/unmapped-file.pdf','//evil.test/blog'])expect(internalNavigationTarget(url,base)).toBeNull()
})
it('keeps both native bridge scripts syntactically valid, including handlers without semicolons',()=>{
  for(const script of [nativeBootstrap,nativeMobileBootstrap,"a.onclick=function(){window.parent.location.href='/blog'}"]){
    const adapted=adaptSourceNavigation(script)
    expect(()=>new Function(adapted)).not.toThrow()
    expect(adapted).toContain('continuumGo(')
  }
})
