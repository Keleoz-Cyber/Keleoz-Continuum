import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })
test.beforeEach(async ({ isMobile }) => {
  test.skip(isMobile, 'The pixel Room contract is Desktop-only.')
})

async function readRoomPersistence(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keleoz-continuum-guest', 1)
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    const record = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
      const transaction = database.transaction('experience-state', 'readonly')
      const request = transaction.objectStore('experience-state').get('wardrobe-sleep')
      request.addEventListener('success', () => resolve(request.result), { once: true })
      request.addEventListener('error', () => reject(request.error), { once: true })
    })
    database.close()
    return {
      keys: Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)),
      record,
      sourceState: localStorage.getItem('suiGameState'),
    }
  })
}

async function openWardrobe(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Wardrobe' }).click()
  const next = page.getByRole('button', { name: 'Next ▸' })
  await expect(next).toBeVisible()
  await page.waitForTimeout(1_200)
  await next.click()
  await expect(page.getByRole('heading', { name: 'Wardrobe' })).toBeVisible()
}

async function advanceSourceDialogue(
  page: import('@playwright/test').Page,
  reached: () => Promise<boolean>,
) {
  const next = page.getByRole('button', { name: 'Next ▸' })
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await reached()) return
    await next.click()
    await page.waitForTimeout(250)
    if (await reached()) return
    if (!await next.isVisible()) {
      await expect.poll(reached, { timeout: 1_500 }).toBe(true)
      return
    }
  }
  expect(await reached()).toBe(true)
}

test('keeps source Wardrobe state in versioned IndexedDB and cleans up on navigation', async ({ page }) => {
  await page.goto('/room')
  await expect(page.getByRole('button', { name: 'Wardrobe' })).toBeVisible()
  await page.waitForTimeout(2_500)
  await openWardrobe(page)
  await page.getByRole('button', { name: 'JK' }).click()

  await expect(page.locator('#game-char-img')).toHaveAttribute('src', /idle_jk\.png$/)
  await expect.poll(async () => (await readRoomPersistence(page)).record).toMatchObject({
    id: 'wardrobe-sleep',
    version: 1,
  })
  const persisted = await readRoomPersistence(page)
  expect(persisted.keys).not.toContain('suiGameState')
  expect(JSON.parse(String(persisted.sourceState))).toMatchObject({ outfitIdx: 4 })
  expect(JSON.parse(String(persisted.record?.sourceState))).toMatchObject({ outfitIdx: 4 })

  await page.getByRole('link', { name: 'Blog' }).click()
  await expect(page).toHaveURL(/\/blog$/)
  await page.waitForTimeout(2_600)
  expect(await page.evaluate(() => localStorage.getItem('suiGameState'))).toBeNull()
})

test('falls back to the exact source localStorage key after a live IndexedDB write failure', async ({ page }) => {
  await page.goto('/room')
  await expect(page.getByRole('button', { name: 'Wardrobe' })).toBeVisible()
  await page.waitForTimeout(2_500)
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('simulated quota failure', 'QuotaExceededError')
    }
  })

  await openWardrobe(page)
  await page.getByRole('button', { name: 'Salome' }).click()

  await expect.poll(async () => page.evaluate(() => {
    const value = localStorage.getItem('suiGameState')
    return value ? JSON.parse(value).outfitIdx : null
  })).toBe(3)
  const fallbackState = await page.evaluate(() => localStorage.getItem('suiGameState'))
  expect(JSON.parse(String(fallbackState))).toMatchObject({ outfitIdx: 3 })
  expect(await page.evaluate(() => Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)))).toContain('suiGameState')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Wardrobe' })).toBeVisible()
  const migrated = await readRoomPersistence(page)
  expect(migrated.keys).not.toContain('suiGameState')
  expect(JSON.parse(String(migrated.sourceState))).toMatchObject({ outfitIdx: 3 })
  expect(JSON.parse(String(migrated.record?.sourceState))).toMatchObject({ outfitIdx: 3 })
})

test('does not leak a late source save when leaving during the auto-wake timer', async ({ page }) => {
  await page.goto('/room')
  await expect(page.getByRole('button', { name: 'Wardrobe' })).toBeVisible()
  await page.getByRole('link', { name: 'Blog' }).click()

  await expect(page).toHaveURL(/\/blog$/)
  await page.waitForTimeout(3_000)
  expect(await page.evaluate(() => localStorage.getItem('suiGameState'))).toBeNull()
})

test('does not leak the inner wake callback after SPA browser-back teardown', async ({ page }) => {
  test.setTimeout(45_000)
  await page.goto('/blog')
  await page.getByRole('link', { name: 'Room' }).click()
  await expect(page.getByRole('button', { name: 'Wardrobe' })).toBeVisible()
  await page.waitForTimeout(2_500)
  await page.getByRole('button', { name: 'Sleep' }).click()
  await expect(page.getByText('现在我该睡觉了吗？', { exact: true })).toBeVisible()
  await advanceSourceDialogue(page, () => page.getByText(/我知道了，好。/).isVisible())
  await advanceSourceDialogue(page, () => page.locator('#game-char-lie').isVisible())
  await expect(page.locator('#game-char-lie')).toBeVisible()
  await page.evaluate(() => {
    const nativeSetTimeout = window.setTimeout.bind(window)
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => (
      nativeSetTimeout(handler, timeout === 800 ? 3_000 : timeout, ...args)
    )) as typeof window.setTimeout
  })
  await page.locator('.game-viewport').evaluate((viewport) => {
    const bounds = viewport.getBoundingClientRect()
    viewport.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    }))
  })
  await expect.poll(async () => page.evaluate(() => (
    window as Window & { G?: { state?: string } }
  ).G?.state)).toBe('waking')

  await page.goBack()
  await expect(page).toHaveURL(/\/blog$/)
  await page.waitForTimeout(3_200)
  expect(await page.evaluate(() => localStorage.getItem('suiGameState'))).toBeNull()
})
