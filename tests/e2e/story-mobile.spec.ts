import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })
test.beforeEach(async ({ isMobile }) => {
  test.skip(!isMobile, 'This suite verifies the Mobile fullscreen Story adapter.')
})

test('opens Story from the authoritative Mobile Desk and preserves the source setup choices', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 })
  await page.goto('/')
  const mobileHome = page.frameLocator('iframe[title="Keleoz Continuum Home"]')
  const storyTile = mobileHome.getByRole('button', { name: '故事' })
  await expect(storyTile).toBeVisible()
  const deskContract = await storyTile.evaluate((story) => {
    const tea = document.querySelector<HTMLElement>('.sb-app[data-page="tea"]')
    const sourceWindow = window as typeof window & { DK_NAMES?: Record<string, string> }
    return {
      teaOrder: Number.parseInt(tea?.style.order ?? '', 10),
      storyOrder: Number.parseInt((story as HTMLElement).style.order, 10),
      storyName: sourceWindow.DK_NAMES?.['app:story'],
    }
  })
  expect(deskContract.storyOrder).toBe(deskContract.teaOrder + 1)
  expect(deskContract.storyName).toBe('故事')
  await storyTile.click()

  await expect(page).toHaveURL(/\/story$/)
  await expect(page.getByRole('heading', { name: /Story/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Story setup' })).toBeVisible()
  await expect(page.getByLabel('Genre')).toHaveValue('fantasy')
  await expect(page.getByLabel('Horror Elements')).toHaveValue('no')
  const stage = await page.locator('.mobile-story-stage').boundingBox()
  expect(stage?.width ?? 0).toBeGreaterThan(360)
  const viewport = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, height: innerHeight }))
  expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.height)
  await page.screenshot({ path: 'output/playwright/mobile-story-setup.png', fullPage: true })
})

test('plays source-style rounds and replaces the ending safety record with the final document', async ({ page }) => {
  test.setTimeout(45_000)
  await page.setViewportSize({ width: 390, height: 667 })
  const requests: Array<Record<string, unknown>> = []
  await page.route('**/api/ai/story', async (route) => {
    const request = route.request().postDataJSON() as Record<string, unknown>
    requests.push(request)
    const mode = request.mode
    const turnNumber = requests.filter((item) => item.mode === 'turn').length
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mode === 'document'
        ? { content: '## 游戏概要\n午夜钟楼重新开始计时。', truncated: false }
        : turnNumber === 1
          ? {
              content: JSON.stringify({
                story: '雨停在午夜十二点，钟楼的门缓缓打开。',
                choices: ['进入钟楼', '检查门锁', '沿街离开'],
                isEnding: false, endingType: null, mood: 'shock',
              }),
              truncated: false,
            }
          : {
              content: JSON.stringify({
                story: '你敲响最后一声钟，城市重新开始流动。',
                choices: [], isEnding: true, endingType: 'normal', mood: 'joy',
              }),
              truncated: false,
              documentGrant: 'a'.repeat(64),
            }),
    })
  })
  await page.goto('/story', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Genre').selectOption('detective')
  await page.getByLabel('Horror Elements').selectOption('mid')
  await page.getByRole('button', { name: 'Start · 开始' }).click()

  await expect(page.getByText('雨停在午夜十二点，钟楼的门缓缓打开。')).toBeVisible()
  expect(await page.locator('.mobile-story-dialogue').evaluate((element) => getComputedStyle(element).backgroundSize)).toBe('cover')
  await expect(page.locator('.mobile-story-sprite')).toHaveAttribute('data-mood', 'shock')
  await page.getByRole('button', { name: '进入钟楼' }).click()
  await expect(page.getByText('你敲响最后一声钟，城市重新开始流动。')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('完整设定文档已保存到当前浏览器。')).toBeVisible()

  expect(requests.map((request) => request.mode)).toEqual(['turn', 'turn', 'document'])
  expect(requests[0]).toMatchObject({ genre: 'detective', horror: 'mid', messages: [{ role: 'user', content: '开始游戏' }] })
  expect(JSON.stringify(requests)).not.toContain('role":"system')
  const records = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('keleoz-continuum-guest', 1)
      open.addEventListener('success', () => resolve(open.result), { once: true })
      open.addEventListener('error', () => reject(open.error), { once: true })
    })
    const result = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
      const request = database.transaction('experience-state', 'readonly').objectStore('experience-state').getAll()
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    database.close()
    return result.filter((record) => record.type === 'story-history')
  })
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({ stage: 'document', version: 1 })
  expect(String(records[0]?.content)).toContain('午夜钟楼重新开始计时')

  const viewport = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: innerWidth }))
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width)
  await page.screenshot({ path: 'output/playwright/mobile-story-ending.png', fullPage: true })
})

test('drops a delayed Story reply after returning to setup', async ({ page }) => {
  let requests = 0
  await page.route('**/api/ai/story', async (route) => {
    requests += 1
    if (requests === 1) await new Promise((resolve) => setTimeout(resolve, 650))
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        content: JSON.stringify({
          story: requests === 1 ? '不该出现的旧故事。' : '这是新的故事。',
          choices: ['继续', '停下', '回头'], isEnding: false, endingType: null, mood: 'calm',
        }),
        truncated: false,
      }),
    }).catch(() => {})
  })
  await page.goto('/story', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Start · 开始' }).click()
  await expect.poll(() => requests).toBe(1)
  await page.getByRole('button', { name: '重新选择' }).click()
  await page.getByRole('button', { name: '退出故事' }).click()
  await page.waitForTimeout(800)
  await expect(page.getByText('不该出现的旧故事。')).toHaveCount(0)
  await page.getByRole('button', { name: 'Start · 开始' }).click()
  await expect(page.getByText('这是新的故事。')).toBeVisible()
})

test('keeps the source four-segment document with an explicit truncation note', async ({ page }) => {
  let turnDone = false
  let segment = 0
  await page.route('**/api/ai/story', async (route) => {
    const request = route.request().postDataJSON() as Record<string, unknown>
    if (request.mode === 'turn') {
      turnDone = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        content: JSON.stringify({ story: '结局。', choices: [], isEnding: true, endingType: 'normal', mood: 'calm' }),
        truncated: false, documentGrant: 'a'.repeat(64),
      }) })
      return
    }
    segment += 1
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      content: `第${segment}段。\n`, truncated: true,
      documentGrant: segment < 4 ? String.fromCharCode(97 + segment).repeat(64) : undefined,
    }) })
  })
  await page.goto('/story', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Start · 开始' }).click()
  await expect.poll(() => turnDone).toBe(true)
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('完整设定文档已保存到当前浏览器。')).toBeVisible()
  expect(segment).toBe(4)
  const content = await page.evaluate(async () => {
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
    return String(records.find((record) => record.type === 'story-history')?.content ?? '')
  })
  expect(content).toContain('第1段。\n第2段。\n第3段。\n第4段。')
  expect(content).toContain('连续4段输出后依然超过上限')
})
