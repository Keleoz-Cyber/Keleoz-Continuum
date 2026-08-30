import { expect, test, type Page } from '@playwright/test'

test.use({ channel: 'chrome' })
test.beforeEach(async ({ isMobile }) => test.skip(isMobile, 'Desktop Tarot runs inside the source pixel Room.'))

async function openTarot(page: Page) {
  await page.goto('/room')
  await expect(page.getByRole('button', { name: 'Tarot' })).toBeVisible()
  await page.waitForTimeout(2_500)
  await page.getByRole('button', { name: 'Tarot' }).click()
  const next = page.locator('#game-dlg-next-btn')
  await page.locator('#game-dlg-text').click()
  await next.click()
  await expect(page.locator('#game-tarot')).toHaveClass(/show/)
  await page.locator('#tarot-change-ai').click()
  await page.locator('#tarot-ai-sel-overlay [data-caid="continuum-site-companion"]').click()
}

async function drawSingle(page: Page) {
  const card = page.locator('.tarot-fan-card:not(.picked)').first()
  await card.click({ force: true })
  await expect(page.locator('.tarot-slot-item.filled')).toHaveCount(1, { timeout: 3_000 })
}

test('lifts the visually topmost card under the desktop pointer', async ({ page }) => {
  await openTarot(page)
  const mismatch = await page.locator('#tarot-fan').evaluate((fanElement) => {
    const fan = fanElement as HTMLElement & { _centers?: Array<{ el: HTMLElement; x: number; y: number }> }
    const cards = Array.from(fan.querySelectorAll<HTMLElement>('.tarot-fan-card'))
    cards.forEach((card) => card.classList.remove('lift'))
    const bounds = fan.getBoundingClientRect()
    for (let y = bounds.top + 20; y < bounds.bottom - 10; y += 6) {
      for (let x = bounds.left + 20; x < bounds.right - 20; x += 6) {
        const actual = document.elementsFromPoint(x, y).find((element) => element.classList.contains('tarot-fan-card')) as HTMLElement | undefined
        if (!actual) continue
        let nearest: HTMLElement | null = null
        let distance = Number.POSITIVE_INFINITY
        for (const center of fan._centers ?? []) {
          const candidate = Math.hypot(x - bounds.left - center.x, y - bounds.top - center.y)
          if (candidate < distance) { distance = candidate; nearest = center.el }
        }
        if (nearest && distance <= 130 && nearest.dataset.idx !== actual.dataset.idx) {
          return { x, y, actual: actual.dataset.idx, oldNearest: nearest.dataset.idx }
        }
      }
    }
    return null
  })
  expect(mismatch).not.toBeNull()
  await page.mouse.move(mismatch!.x, mismatch!.y)
  await expect.poll(async () => page.locator('.tarot-fan-card.lift').getAttribute('data-idx')).toBe(mismatch!.actual)
})

test('preserves the source draw/read/follow-up/save flow in Guest IndexedDB', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = []
  await page.route('**/api/ai/tarot', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    requests.push(body)
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      content: body.mode === 'reading' ? '这张牌提醒你保持平衡。' : '更具体地说，请相信自己的判断。',
      followupGrant: body.mode === 'reading' ? 'a'.repeat(64) : 'b'.repeat(64),
    }) })
  })
  await openTarot(page)
  await expect(page.locator('.tarot-fan-card')).toHaveCount(78)
  await drawSingle(page)
  await page.getByRole('button', { name: 'Invite AI' }).click()
  await expect(page.locator('#tarot-reading-panel')).toContainText('这张牌提醒你保持平衡。')
  await page.getByRole('button', { name: '追问' }).click()
  await page.getByRole('button', { name: '希望TA解说得更详细' }).click()
  await expect(page.locator('#tarot-reading-panel')).toContainText('请相信自己的判断。')
  await page.getByRole('button', { name: 'Save' }).click()

  expect(requests.map((request) => request.mode)).toEqual(['reading', 'followup'])
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
    return result.filter((record) => record.type === 'tarot-history')
  })
  expect(records).toHaveLength(1)
  expect(String(records[0]?.content)).toContain('【AI解读】')
  expect(String(records[0]?.content)).toContain('【追问】')
  await page.screenshot({ path: 'output/playwright/tarot-source-reading.png', fullPage: true })
})

test('keeps source Tarot retry controls when the site AI switch is disabled', async ({ page }) => {
  await openTarot(page)
  await drawSingle(page)
  await page.getByRole('button', { name: 'Invite AI' }).click()
  await expect(page.locator('#tarot-reading-panel')).toContainText('Tarot AI 暂未开放', { timeout: 5_000 })
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible()
})
