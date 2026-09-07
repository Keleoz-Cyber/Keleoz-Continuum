import { test,expect } from '@playwright/test'

test('original appearance drafts publish safely across Desktop and Mobile, with dual-theme profile media',async({page,isMobile})=>{
  const databaseUrl=process.env.E2E_DATABASE_URL
  test.skip(isMobile||!databaseUrl||!process.env.E2E_OWNER_PASSWORD,'Explicit local QA database and Owner required')
  if(!['localhost','127.0.0.1'].includes(new URL(databaseUrl!).hostname))throw new Error('Local QA only')
  test.setTimeout(180000)
  const {Pool}=await import('pg'),sharp=(await import('sharp')).default,{createHash}=await import('node:crypto')
  const pool=new Pool({connectionString:databaseUrl})
  const where="(store='_site' and key='public') or (store='about' and key='main') or (store='apiSettings' and key in ('mobilePrefs','mobileBgs','desktopAppearance'))"
  const backup=(await pool.query('select * from owner_source_records where '+where)).rows
  const before=new Set((await pool.query('select id from media_objects')).rows.map(r=>r.id))
  const images=await Promise.all([31,203].map(r=>sharp({create:{width:24,height:24,channels:3,background:{r,g:Date.now()%200,b:91}}}).png().toBuffer()))
  const hashes=new Set(images.map(img=>createHash('sha256').update(img).digest('hex')))
  const read=async(key:string)=> (await pool.query('select value from owner_source_records where store=\'apiSettings\' and key=$1',[key])).rows[0]?.value
  try{
    await page.setViewportSize({width:1440,height:1000});await page.goto('/studio/login')
    await page.getByLabel('Username').fill(process.env.E2E_OWNER_USERNAME||'admin');await page.getByLabel('Password').fill(process.env.E2E_OWNER_PASSWORD!)
    await page.getByRole('button',{name:'Enter Studio'}).click();await expect(page).toHaveURL(/\/studio$/)
    await page.goto('/studio/appearance');const desktop=page.frameLocator('iframe')
    await expect(desktop.getByRole('heading',{name:'DIY',exact:true})).toBeVisible()
    await desktop.getByLabel('Internal 网站背景',{exact:true}).setInputFiles({name:'appearance-qa.png',mimeType:'image/png',buffer:images[0]})
    await expect.poll(async()=>!!(await read('desktopAppearance'))?.internal).toBe(true)
    await page.getByRole('button',{name:'发布已保存外观',exact:true}).click();await expect(page).toHaveURL(/saved=1/)
    const published=(await pool.query("select value from owner_source_records where store='_site' and key='public'")).rows[0].value
    expect(published.appearance.desktop.internal).toBeTruthy()
    const adapted=await(await page.request.get('/reference/internal-beyond/InternalBeyond.html?continuum-gloss=2')).text()
    expect(adapted).toContain('/media/'+published.appearance.desktop.internal+'/large.webp')
    await page.getByRole('link',{name:'Mobile 布局',exact:true}).click();await expect(page).toHaveURL(/view=mobile/)
    await expect(page.frameLocator('iframe').locator('#page-visual')).toBeVisible()
    expect((await page.locator('iframe').boundingBox())!.width).toBeLessThanOrEqual(440)
    await page.setViewportSize({width:390,height:844});await page.goto('/studio/appearance')
    const mobile=page.frameLocator('iframe[src*="mobile=1"]');await expect(mobile.locator('#page-visual')).toBeVisible()
    await mobile.locator('#uv-alpha').evaluate(el=>{(el as HTMLInputElement).value='80';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))})
    await expect.poll(async()=>(await read('mobilePrefs'))?.ui?.panelAlpha).toBe(80)
    await page.getByRole('button',{name:'预览桌面 / 返回设置'}).click();await expect(mobile.locator('#page-profile')).toBeVisible()
    await mobile.locator('body').evaluate(async()=>{await new Function("return _dkSave(['app:blog','app:letters','hero'],['app:calendar'],{'app:blog':1})")()})
    await page.getByRole('button',{name:'发布已保存外观',exact:true}).click();await expect(page).toHaveURL(/saved=1/)
    await page.goto('/');const home=page.frameLocator('iframe')
    await expect.poll(()=>home.locator('body').evaluate(()=>new Function('return !!window.__continuumSiteApplied')())).toBe(true)
    const mobilePublished=(await pool.query("select value from owner_source_records where store='_site' and key='public'")).rows[0].value
    expect(mobilePublished.appearance.desk.hidden).toContain('app:calendar')
    await expect(home.locator('#sb-calapp')).toHaveClass(/dk-hidden/);await expect(home.locator('#sb-calapp')).not.toBeVisible()
    expect(await home.locator('body').evaluate(()=>new Function('return _mp.ui.panelAlpha')())).toBe(80)
    const imageUrl=(i:number)=>'data:image/png;base64,'+images[i].toString('base64')
    const profile={id:'main',name:'Appearance QA',bio:'PRIVATE BIO DO NOT PUBLISH',bioPrivate:true,avatar:imageUrl(0),bgImage:imageUrl(0),galleryImages:[imageUrl(0)],infAvatar:imageUrl(1),infBgImage:imageUrl(1),infGalleryImages:[imageUrl(1)]}
    expect(await page.evaluate(async value=>(await fetch('/api/studio/source-records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({op:'put',store:'about',key:'main',value})})).status,profile)).toBe(200)
    await page.goto('/studio/profile');await expect(page.frameLocator('iframe').locator('#pf-name')).toHaveText('Appearance QA')
    await page.getByRole('button',{name:'发布已保存资料',exact:true}).click();await expect(page).toHaveURL(/profile=published/)
    const config=(await pool.query("select value from owner_source_records where store='_site' and key='public'")).rows[0].value
    expect(config.infernalAvatarId).not.toBe(config.avatarId);expect(config.bio).toBe('')
    await page.evaluate(()=>localStorage.setItem('continuum_theme','infernal'));await page.goto('/about')
    await expect(page.locator('.source-about-avatar img')).toHaveAttribute('src',`/media/${config.infernalAvatarId}/card.webp`)
    await expect(page.locator('.source-about-gallery img')).toHaveAttribute('src',`/media/${config.infernalGalleryIds[0]}/large.webp`)
    expect(await(await page.request.get('/about')).text()).not.toContain('PRIVATE BIO DO NOT PUBLISH')
    await page.locator('.source-page').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})))})
    await page.screenshot({path:'output/playwright/appearance-mobile-profile.png'})
  }finally{
    await pool.query('delete from owner_source_records where '+where)
    for(const r of backup)await pool.query('insert into owner_source_records(store,key,value,updated_at) values($1,$2,$3,$4)',[r.store,r.key,r.value,r.updated_at])
    const created=(await pool.query('select id,sha256 from media_objects')).rows.filter(r=>!before.has(r.id)&&hashes.has(r.sha256))
    for(const r of created)await page.evaluate(async id=>{await fetch('/api/studio/media?id='+id,{method:'DELETE'})},r.id)
    await pool.end()
  }
})
