import { test,expect } from '@playwright/test'

test('native stale objects cannot restore revoked or deleted Memory, and resize preserves the workspace',async({page,isMobile})=>{
  test.skip(isMobile||!process.env.E2E_OWNER_PASSWORD,'Local Owner required')
  test.setTimeout(90000)
  const key='qa_memory_version_'+Date.now()
  await page.setViewportSize({width:1440,height:1000});await page.goto('/studio/login')
  await page.getByLabel('Username').fill(process.env.E2E_OWNER_USERNAME||'admin');await page.getByLabel('Password').fill(process.env.E2E_OWNER_PASSWORD!)
  await page.getByRole('button',{name:'Enter Studio'}).click();await expect(page).toHaveURL(/\/studio$/)
  const put=(visibility:string)=>page.evaluate(async({key,visibility})=>(await fetch('/api/studio/source-records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({op:'put',store:'memories',key,value:{id:key,title:'Temporary version QA',content:'QA only',visibility}})})).status,{key,visibility})
  const remove=()=>page.evaluate(async key=>(await fetch('/api/studio/source-records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({op:'delete',store:'memories',key})})).status,key)
  expect(await put('public')).toBe(200)
  try{
    await page.goto('/chat');const frame=page.frameLocator('iframe');await expect(frame.locator('#chat-full-input')).toBeVisible()
    await frame.locator('body').evaluate(async(_el,key)=>{await new Function('key','return dbGet("memories",key).then(row=>{window.__qaOldMemory=row})')(key)},key)
    expect(await put('private')).toBe(200)
    const result=await frame.locator('body').evaluate(async()=>new Function('return (async()=>{await dbGetAll("memories");try{await dbPut("memories",window.__qaOldMemory);return "overwritten"}catch(e){return e.message}})()')())
    expect(result).toContain('其他窗口')
    const rows=await page.evaluate(async()=>await(await fetch('/api/studio/source-records?store=memories')).json())
    expect(rows.find((r:{key:string})=>r.key===key).value.visibility).toBe('private')
    expect(await remove()).toBe(200)
    expect(await frame.locator('body').evaluate(async()=>new Function('return dbPut("memories",window.__qaOldMemory).then(()=>false,()=>true)')())).toBe(true)
    await frame.locator('#chat-full-input').evaluate(el=>{(el as HTMLTextAreaElement).value='unsent resize fixture';(window as Window&{__qaWindow?:boolean}).__qaWindow=true})
    await page.setViewportSize({width:390,height:844})
    await expect(frame.locator('#chat-full-input')).toHaveValue('unsent resize fixture')
    expect(await frame.locator('body').evaluate(()=>(window as Window&{__qaWindow?:boolean}).__qaWindow)).toBe(true)
  }finally{await remove()}
})
