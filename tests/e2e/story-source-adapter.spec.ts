import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({ channel: 'chrome' })
test.beforeEach(async ({ isMobile }) => {
  test.skip(isMobile, 'Desktop Story runs inside the source pixel Room; Mobile Story follows after this contract.')
})

async function advanceDialogueUntil(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (await target.isVisible()) return
    const text = page.locator('#game-dlg-text')
    if (await text.isVisible()) await text.click()
    const next = page.locator('#game-dlg-next-btn')
    if (await next.isVisible()) await next.click()
    await page.waitForTimeout(120)
  }
  await expect(target).toBeVisible()
}

async function startStory(page: Page, genre = 'detective', horror = 'mid') {
  await page.goto('/room')
  await expect(page.getByRole('button', { name: 'Story' })).toBeVisible()
  await page.waitForTimeout(2_500)
  await page.getByRole('button', { name: 'Story' }).click()
  const startChoice = page.locator('.game-choice-btn', { hasText: '开始游戏' })
  await advanceDialogueUntil(page, startChoice)
  await startChoice.click()
  await expect(page.getByRole('heading', { name: 'Interactive Story' })).toBeVisible()
  await page.locator('#game-genre').selectOption(genre)
  await page.locator('#game-horror').selectOption(horror)
  await page.locator('#game-ai-start').click()
  await advanceDialogueUntil(page, page.locator('#game-story-win.show'))
  await expect(page.locator('#game-story-win')).toHaveClass(/show/)
}

async function storyHistory(page: Page) {
  return page.evaluate(async () => {
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
    return records.filter((record) => record.type === 'story-history')
  })
}

test('preserves source Story setup, pixel window, choices, and progress Save in Guest IndexedDB', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.route('**/api/ai/story', async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: JSON.stringify({
          story: '雨停在午夜十二点，钟楼的门缓缓打开。',
          choices: ['进入钟楼', '检查门锁', '沿街离开'],
          isEnding: false,
          endingType: null,
          mood: 'shock',
        }),
        truncated: false,
      }),
    })
  })
  await startStory(page)

  await expect(page.locator('#game-dlg-text')).toContainText('雨停在午夜十二点', { timeout: 5_000 })
  await expect(page.locator('#sw-sprite')).toHaveClass(/sw-mood-shock/)
  await expect(page.locator('#game-dlg-save')).toBeVisible()
  await page.locator('#game-dlg-save').click()
  await expect.poll(async () => (await storyHistory(page)).length).toBe(1)
  expect((await storyHistory(page))[0]).toMatchObject({ type: 'story-history', version: 1, stage: 'progress' })

  expect(requests).toHaveLength(1)
  expect(requests[0]).toMatchObject({ mode: 'turn', genre: 'detective', horror: 'mid' })
  expect(JSON.stringify(requests)).not.toContain('role":"system')
  await page.screenshot({ path: 'output/playwright/story-source-progress.png', fullPage: true })
})

test('preserves source ending Save and replaces the safety record with the final document', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.route('**/api/ai/story', async (route) => {
    const request = route.request().postDataJSON() as Record<string, unknown>
    requests.push(request)
    const documentMode = request.mode === 'document'
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: documentMode
          ? '## 游戏概要\n钟楼在午夜寻找新的守钟人。\n\n## 完整剧本\n访客打开了门。'
          : JSON.stringify({
              story: '你敲响最后一声钟，城市重新开始流动。',
              choices: [],
              isEnding: true,
              endingType: 'normal',
              mood: 'joy',
            }),
        truncated: false,
        documentGrant: documentMode ? undefined : 'a'.repeat(64),
      }),
    })
  })
  await startStory(page, 'fantasy', 'no')
  await expect(page.locator('#game-dlg-text')).toContainText('城市重新开始流动', { timeout: 5_000 })
  const endingSave = page.locator('#game-dlg-actions .game-dialogue-action', { hasText: 'Save' })
  await advanceDialogueUntil(page, endingSave)
  await endingSave.click()

  await expect.poll(async () => (await storyHistory(page))[0]?.stage, { timeout: 8_000 }).toBe('document')
  const records = await storyHistory(page)
  expect(records).toHaveLength(1)
  expect(String(records[0]?.content)).toContain('## 游戏概要')
  expect(requests.map((request) => request.mode)).toEqual(['turn', 'document'])
  expect(requests[1]).toMatchObject({ genre: 'fantasy', horror: 'no', documentSoFar: '' })
})

test('keeps the original retry/save/exit recovery surface when Story AI is disabled', async ({ page }) => {
  await startStory(page)
  await expect(page.locator('#game-story-win')).toHaveClass(/show/)
  await expect(page.locator('#game-dlg-text')).toContainText('Story AI 暂未开放', { timeout: 5_000 })
  const retry = page.locator('.game-dialogue-action', { hasText: '重试' })
  await advanceDialogueUntil(page, retry)
  await expect(retry).toBeVisible()
  await expect(page.locator('.game-dialogue-action', { hasText: '存档并退出' })).toBeVisible()
  await expect(page.locator('.game-dialogue-action', { hasText: /^退出$/ })).toBeVisible()
})
