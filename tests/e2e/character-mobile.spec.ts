import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })
test.beforeEach(async ({ isMobile }) => {
  test.skip(!isMobile, 'Mobile Character fullscreen adapter only.')
})

test('opens Character after Tarot from the authoritative Mobile Desk', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 })
  await page.goto('/')
  const home = page.frameLocator('iframe[title="Keleoz Continuum Home"]')
  const tile = home.getByRole('button', { name: '角色' })

  await expect(tile).toBeVisible()
  const order = await home.locator('.sb-app[data-page="character"]').evaluate((character) => {
    const tarot = document.querySelector<HTMLElement>('.sb-app[data-page="tarot"]')
    return {
      tarot: Number.parseInt(tarot?.style.order ?? '', 10),
      character: Number.parseInt((character as HTMLElement).style.order, 10),
    }
  })
  expect(order.character).toBe(order.tarot + 1)

  await tile.click()
  await expect(page).toHaveURL(/\/character$/)
  await expect(page.getByRole('heading', { name: /Character/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Wardrobe' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sleep' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('reuses source Wardrobe and Sleep behavior and persists the shared record', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 })
  await page.goto('/character')

  await page.getByRole('button', { name: 'Wardrobe' }).click()
  await expect(page.getByText(/想看我穿什么样的衣服|让我偶尔试试|想买新衣服/)).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Wardrobe' })).toBeVisible()
  await expect(page.locator('.mobile-character-outfit')).toHaveCount(6)
  await page.getByRole('button', { name: 'JK' }).click()
  await expect(page.locator('.mobile-character-portrait')).toHaveAttribute('src', /\/game\/portraits\/jk\.png/)
  await expect(page.locator('.mobile-character-idle img')).toHaveAttribute('src', /\/game\/sprites\/idle_jk\.png/)

  const outfitRecord = await readRecord(page)
  expect(outfitRecord?.id).toBe('wardrobe-sleep')
  expect(outfitRecord?.version).toBe(1)
  expect(JSON.parse(String(outfitRecord?.sourceState))).toMatchObject({ outfitIdx: 4, state: 'idle' })

  await page.getByRole('button', { name: 'Sleep' }).click()
  await expect(page.getByText('现在我该睡觉了吗？')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('我知道了，好。')).toBeVisible()
  await expect(page.getByText('晚安。')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.mobile-character-stage')).toHaveAttribute('data-phase', 'sleeping')
  await expect(page.locator('.mobile-character-lie img')).toHaveAttribute('src', /\/game\/sprites\/lie_jk\.png/)

  await page.locator('.mobile-character-stage').click()
  await expect(page.locator('.mobile-character-stage')).toHaveAttribute('data-phase', 'awake', { timeout: 2_000 })
  expect(JSON.parse(String((await readRecord(page))?.sourceState))).toMatchObject({
    outfitIdx: 4,
    charX: 350,
    charY: 550,
    facing: 'down',
    state: 'idle',
    lieMode: 'awake',
  })

  await page.screenshot({ path: 'output/playwright/mobile-character-awake.png', fullPage: true })
})

async function readRecord(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keleoz-continuum-guest', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const record = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
      const request = database.transaction('experience-state', 'readonly').objectStore('experience-state').get('wardrobe-sleep')
      request.onsuccess = () => resolve(request.result as Record<string, unknown> | undefined)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return record
  })
}
