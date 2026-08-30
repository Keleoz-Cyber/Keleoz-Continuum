import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })
test.beforeEach(async ({ isMobile }) => {
  test.skip(isMobile, 'Desktop Tea currently runs inside the source pixel Room.')
})

async function enterTeaChat(page: import('@playwright/test').Page) {
  await page.goto('/room')
  await expect(page.getByRole('button', { name: 'Tea' })).toBeVisible()
  await page.waitForTimeout(2_500)
  await page.getByRole('button', { name: 'Tea' }).click()
  await expect(page.locator('#game-tea-overlay')).toHaveClass(/show/)

  await page.locator('.tea-drink-icon[data-drink-id="green"]').dispatchEvent('click')
  await page.locator('.tea-dessert-icon[data-dessert-id="matcha"]').dispatchEvent('click')
  await expect(page.locator('#tea-mood-text')).toContainText('绿色心情')
  await page.getByRole('button', { name: 'Start' }).click()

  await expect(page.locator('#game-tea-api-sel')).toHaveClass(/show/)
  await page.locator('#tea-dd-trigger').click()
  await page.getByRole('option', { name: 'Keleoz' }).click()
  await page.getByRole('button', { name: '入座' }).click()
  await expect(page.locator('#game-tea-chat')).toHaveClass(/show/, { timeout: 8_000 })
}

test('preserves source Tea selection/chat and saves history only to Guest IndexedDB', async ({ page }) => {
  const requests: unknown[] = []
  await page.route('**/api/ai/tea', async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: requests.length === 1 ? '茶温正好，我们慢慢坐一会儿。' : '我还在。' }),
    })
  })
  await enterTeaChat(page)

  await expect(page.locator('#tea-chat-messages')).toContainText('茶温正好', { timeout: 5_000 })
  await page.locator('#tea-chat-input').fill('你还在吗？')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.locator('#tea-chat-messages')).toContainText('我还在。')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('#tea-chat-messages')).toContainText('已存档。')

  expect(requests).toHaveLength(2)
  expect(requests[0]).toMatchObject({
    drink: 'green',
    dessert: 'matcha',
    messages: [{ role: 'user' }],
  })
  expect(JSON.stringify(requests)).not.toContain('role":"system')

  const localHistory = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('keleoz-continuum-guest', 1)
      open.addEventListener('success', () => resolve(open.result), { once: true })
      open.addEventListener('error', () => reject(open.error), { once: true })
    })
    const records = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
      const request = database.transaction('experience-state', 'readonly').objectStore('experience-state').getAll()
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    database.close()
    return records.filter((record) => record.type === 'tea-history')
  })
  expect(localHistory).toHaveLength(1)
  expect(localHistory[0]).toMatchObject({ type: 'tea-history', version: 1 })
  expect(String(localHistory[0]?.content)).toContain('你还在吗？')
})

test('keeps the exact Tea flow visible when the site AI kill switch is off', async ({ page }) => {
  await enterTeaChat(page)
  await expect(page.locator('#tea-chat-messages')).toContainText('Tea AI 暂未开放', { timeout: 5_000 })
  await expect(page.getByRole('button', { name: '离开茶歇' })).toBeVisible()
})

test('keeps the site companion scoped to implemented Room features', async ({ page }) => {
  await page.goto('/room')
  await expect(page.getByRole('button', { name: 'Story' })).toBeVisible()
  await page.waitForTimeout(2_500)
  await page.getByRole('button', { name: 'Story' }).click()
  await expect(page.getByText('今天会给我设计怎样的游戏呢？', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as Window & { apiConfigs?: unknown[] }).apiConfigs?.length)).toBe(1)
  await page.getByRole('button', { name: 'Tarot' }).click()
  expect(await page.evaluate(() => (window as Window & { apiConfigs?: unknown[] }).apiConfigs?.length)).toBe(1)
})
