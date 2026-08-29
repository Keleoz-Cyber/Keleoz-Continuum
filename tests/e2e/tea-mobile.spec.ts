import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })
test.beforeEach(async ({ isMobile }) => {
  test.skip(!isMobile, 'This suite verifies the Mobile fullscreen Tea adapter.')
})

test('opens the functional Tea app from the authoritative Mobile Desk', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 })
  await page.goto('/')
  const mobileHome = page.frameLocator('iframe[title="Keleoz Continuum Home"]')
  const teaTile = mobileHome.getByRole('button', { name: '茶歇' })

  await expect(teaTile).toBeVisible()
  await expect.poll(async () => teaTile.evaluate((element) => element.getAttribute('style') ?? '')).toContain('order')
  const deskContract = await mobileHome.locator('#sb-musicapp').evaluate((music) => {
    const tea = document.querySelector<HTMLElement>('.sb-app[data-page="tea"]')
    const sourceWindow = window as typeof window & { DK_NAMES?: Record<string, string> }
    return {
      musicOrder: Number.parseInt((music as HTMLElement).style.order, 10),
      teaOrder: Number.parseInt(tea?.style.order ?? '', 10),
      teaName: sourceWindow.DK_NAMES?.['app:tea'],
    }
  })
  expect(deskContract.teaOrder).toBe(deskContract.musicOrder + 1)
  expect(deskContract.teaName).toBe('茶歇')
  await teaTile.click()
  await expect(page).toHaveURL(/\/tea$/)
  await expect(page.getByRole('heading', { name: /Tea/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tea selection' })).toBeVisible()
  const selectionBox = await page.locator('.mobile-tea-board').boundingBox()
  const viewportWidth = await page.evaluate(() => innerWidth)
  expect(selectionBox?.width ?? 0).toBeGreaterThan(viewportWidth * .88)
  const vertical = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, height: innerHeight }))
  expect(vertical.scrollHeight).toBeLessThanOrEqual(vertical.height)
})

test('uses the shared Tea gateway and saves chat only to Guest IndexedDB', async ({ page }) => {
  test.setTimeout(45_000)
  await page.setViewportSize({ width: 390, height: 667 })
  const requests: unknown[] = []
  await page.route('**/api/ai/tea', async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: requests.length === 1
          ? '茶温正好，我们慢慢坐一会儿。'
          : requests.length === 2 ? '我还在。' : '这句话也收好了。',
      }),
    })
  })
  await page.goto('/tea', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: '绿茶' }).click()
  await page.getByRole('button', { name: '抹茶布丁' }).click()
  await expect(page.getByText('绿色心情。亲爱的，我想知道你在暗示我什么？')).toBeVisible()
  await page.getByRole('button', { name: 'Start · 入座' }).click()
  await expect(page.getByRole('region', { name: 'Tea chat' })).toBeVisible()
  const chatBox = await page.locator('.mobile-tea-chat-panel').boundingBox()
  const viewportWidth = await page.evaluate(() => innerWidth)
  expect(chatBox?.width ?? 0).toBeGreaterThan(viewportWidth * .88)
  expect(await page.locator('.mobile-tea-chat-bg').evaluate((element) => getComputedStyle(element).objectFit)).toBe('cover')
  await expect(page.getByText('茶温正好，我们慢慢坐一会儿。')).toBeVisible()

  await page.getByRole('textbox', { name: 'Tea message' }).fill('你还在吗？')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('我还在。')).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('已保存到当前浏览器。')).toBeVisible()
  await page.getByRole('textbox', { name: 'Tea message' }).fill('还想再说一句。')
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('这句话也收好了。')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('已保存到当前浏览器。')).toBeVisible()
  await expect(page.getByText('2 / 10')).toBeVisible()

  expect(requests).toHaveLength(3)
  expect(requests[0]).toMatchObject({ drink: 'green', dessert: 'matcha', messages: [{ role: 'user' }] })
  const localHistory = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keleoz-continuum-guest', 1)
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    const records = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
      const request = database.transaction('experience-state', 'readonly').objectStore('experience-state').getAll()
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    database.close()
    return records.filter((record) => record.type === 'tea-history')
  })
  expect(localHistory).toHaveLength(2)
  expect(localHistory.some((record) => String(record.content).includes('还想再说一句。'))).toBe(true)

  const viewport = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: innerWidth }))
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width)
  await page.screenshot({ path: 'output/playwright/mobile-tea-chat.png', fullPage: true })
})

test('drops a delayed assistant response after reset and keeps the new Tea session clean', async ({ page }) => {
  let requests = 0
  await page.route('**/api/ai/tea', async (route) => {
    requests += 1
    if (requests === 1) await new Promise((resolve) => setTimeout(resolve, 650))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: requests === 1 ? '不该出现的旧回复。' : '这是新茶席。' }),
    }).catch(() => {})
  })
  await page.goto('/tea', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '绿茶' }).click()
  await page.getByRole('button', { name: '抹茶布丁' }).click()
  await page.getByRole('button', { name: 'Start · 入座' }).click()
  await expect.poll(() => requests).toBe(1)
  await page.getByRole('button', { name: '重新选择' }).click()
  await expect(page.getByRole('region', { name: 'Tea selection' })).toBeVisible()
  await page.waitForTimeout(800)
  await expect(page.getByText('不该出现的旧回复。')).toHaveCount(0)

  await page.getByRole('button', { name: '绿茶' }).click()
  await page.getByRole('button', { name: '抹茶布丁' }).click()
  await page.getByRole('button', { name: 'Start · 入座' }).click()
  await expect(page.getByText('这是新茶席。')).toBeVisible()
  await expect(page.getByText('不该出现的旧回复。')).toHaveCount(0)
})

test('keeps visitor rounds separate from the opening request and performs the source Bye closing flow', async ({ page }) => {
  test.setTimeout(45_000)
  const requests: Array<{ messages?: Array<{ content?: string }> }> = []
  await page.route('**/api/ai/tea', async (route) => {
    const body = route.request().postDataJSON() as { messages?: Array<{ content?: string }> }
    requests.push(body)
    const closing = body.messages?.at(-1)?.content?.includes('准备结束茶歇')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: closing ? '下次再一起喝茶。' : `回应 ${requests.length}` }),
    })
  })
  await page.goto('/tea', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '绿茶' }).click()
  await page.getByRole('button', { name: '抹茶布丁' }).click()
  await page.getByRole('button', { name: 'Start · 入座' }).click()
  await expect(page.getByText('回应 1')).toBeVisible()

  for (let round = 1; round <= 5; round += 1) {
    await page.getByRole('textbox', { name: 'Tea message' }).fill(`第 ${round} 轮`)
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByText(`回应 ${round + 1}`)).toBeVisible()
  }

  await expect(page.getByText('5 / 10')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Bye' })).toBeEnabled()
  await page.getByRole('button', { name: 'Bye' }).click()
  await expect(page.getByText('下次再一起喝茶。')).toBeVisible()
  await expect(page.getByText('茶歇结束了。点击 Save 保存对话记录。')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ended' })).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Tea message' })).toBeDisabled()
  expect(requests).toHaveLength(7)
  expect(requests.at(-1)?.messages?.at(-1)?.content).toContain('[对方准备结束茶歇了。请温柔地说再见。用1-2句话自然收尾。]')
  await page.getByRole('button', { name: 'Save' }).click()
  const savedDeparture = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keleoz-continuum-guest', 1)
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    const records = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
      const request = database.transaction('experience-state', 'readonly').objectStore('experience-state').getAll()
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    database.close()
    return records.find((record) => record.type === 'tea-history')
  })
  expect(String(savedDeparture?.content)).toContain('Visitor：[对方准备离开了]')
})
