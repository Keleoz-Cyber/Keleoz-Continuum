import { expect, test } from '@playwright/test'

test('original writer, Memory and Chat share private server data with Mobile', async ({ page, isMobile }) => {
  const username = process.env.E2E_OWNER_USERNAME
  const password = process.env.E2E_OWNER_PASSWORD
  test.skip(isMobile || !username || !password, 'Requires the local Owner; mobile is verified in the same session.')
  test.setTimeout(90_000)
  const title = `Native QA ${Date.now()}`
  const companion = `qa_native_${Date.now()}`
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
  const mutate = (data: unknown) => page.evaluate(async payload => { const response = await fetch('/api/studio/source-records', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error(`Write failed: ${response.status}`); return response.json() }, data)
  const read = (url: string) => page.evaluate(async path => { const response = await fetch(path); if (!response.ok) throw new Error(`Read failed: ${response.status}`); return response.json() }, url)
  await page.setViewportSize({ width: 1440, height: 1000 })
  expect((await page.request.get(`${base}/api/studio/source-document`)).status()).toBe(401)
  await page.goto('/chat')
  await expect(page).toHaveURL(/login\?next=/)
  await page.getByLabel('Username').fill(username!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: 'Enter Studio' }).click()
  await expect(page).toHaveURL(/\/chat$/)
  await mutate({ op: 'put', store: 'apiConfigs', key: companion, value: { id: companion, nickname: title, model: 'Site AI', provider: 'openai', systemPrompt: 'QA', autoMem: true, streaming: true } })
  try {
    await page.goto('/studio/write')
    const writer = page.frameLocator('iframe')
    await writer.locator('#ed-title').fill(title)
    await writer.locator('#ed-format').selectOption('md')
    await writer.locator('#ed-content').fill('**Native content**')
    await expect(writer.locator('#rift-chars')).toHaveText('18')
    await expect(writer.locator('.rift-mdbar')).toBeVisible()
    await expect(writer.locator('.rift-sidebar')).toHaveCSS('width', '260px')
    await page.screenshot({ path: 'output/playwright/native-writer-desktop.png' })
    await writer.getByRole('button', { name: '保存并返回', exact: true }).click()
    await expect(writer.getByText(title, { exact: true })).toBeVisible()
    const posts = await read('/api/studio/source-posts')
    const post = posts.find((item: { title: string }) => item.title === title)
    expect(post.format).toBe('md')
    expect(Number.isFinite(post.created)).toBe(true)
    await page.goto(`/studio/content/${post.id}/settings`)
    await page.getByLabel('公开范围').selectOption('full')
    await page.getByRole('button', { name: '保存发布设置' }).click()
    await expect(page).toHaveURL(/saved=1/)
    await page.goto(`/studio/content/${post.id}/preview`)
    await expect(page.locator('strong').filter({ hasText: 'Native content' }).first()).toBeVisible()

    await page.goto('/memory')
    const memory = page.frameLocator('iframe')
    await memory.getByRole('button', { name: '+ 新记忆', exact: true }).click()
    await memory.locator('#mem-f-title').fill(title)
    await memory.locator('#mem-f-content').fill('Native memory persists.')
    await memory.getByRole('button', { name: '保存', exact: true }).click()
    await expect(memory.locator('.mem-star:not(.mem-star-am)').filter({ hasText: title })).toBeVisible()
    await expect(memory.locator('.mem-star-am').filter({ hasText: title })).toBeVisible()
    await expect(memory.locator('#mem-sky-lines')).toBeAttached()
    await page.screenshot({ path: 'output/playwright/native-memory-desktop.png', fullPage: true })

    await page.route('**/api/studio/source-ai', async route => {
      const text = 'Native QA reply.<mem_create category="personal_context" priority="normal">Native auto memory.</mem_create>'
      const request = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: request.stream ? 'text/event-stream' : 'application/json', body: request.stream
        ? `data: ${JSON.stringify({ id: 'qa', choices: [{ delta: { content: text }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`
        : JSON.stringify({ id: 'qa', choices: [{ message: { content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 20 } }) })
    })
    await page.goto('/chat')
    const chat = page.frameLocator('iframe')
    await chat.locator('#friends-list').getByText(title, { exact: true }).click()
    await chat.locator('#chat-full-input').fill('Native QA question')
    await chat.locator('#chat-full-input').press('Enter')
    await expect(chat.getByText('Native QA reply.', { exact: true }).first()).toBeVisible()
    await chat.getByRole('button', { name: '浮动窗口' }).click()
    await expect(chat.locator('#chat-panel.show')).toBeVisible()
    await chat.locator('#chat-panel').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)) })
    await page.screenshot({ path: 'output/playwright/native-chat-desktop.png' })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/memory')
    const mobile = page.frameLocator('iframe')
    await expect(mobile.locator('#ib-splash')).toHaveCount(0, { timeout: 15000 })
    await expect(mobile.locator('#page-memory #mem-list').getByText(title, { exact: true })).toBeVisible()
    await mobile.getByRole('button', { name: 'Auto Memory', exact: true }).click()
    await expect(mobile.getByText('Native auto memory.', { exact: true })).toBeVisible()
    await page.screenshot({ path: 'output/playwright/native-memory-mobile.png' })

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`/studio?q=${encodeURIComponent(title)}`)
    const row = page.locator('.studio-content-row').filter({ hasText: title })
    await row.getByRole('button', { name: 'Archive', exact: true }).click()
    await expect(page).toHaveURL(/content=archived/)
    await page.goto(`/studio?q=${encodeURIComponent(title)}&status=archived`)
    const archived = page.locator('.studio-content-row').filter({ hasText: title })
    await archived.getByText('Permanent delete', { exact: true }).click()
    await archived.getByLabel('Owner password').fill(password!)
    await archived.getByRole('button', { name: 'Delete permanently' }).click()
    await expect(page).toHaveURL(/content=deleted/)
  } finally {
    const records = await read('/api/studio/source-records')
    for (const record of records) {
      if (record.key === companion || record.value.friendId === companion || record.value.title === title)
        await mutate({ op: 'delete', store: record.store, key: record.key })
    }
  }
})
