import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })

test('keeps the exact Desktop Scene as the first viewport and continues below it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop Scene/below-fold contract.')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const frame = page.locator('iframe[title="Keleoz Continuum Home"]')
  await expect(frame).toBeVisible()
  expect((await frame.boundingBox())?.height).toBe(900)
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeAttached()
  await expect(page.getByRole('heading', { name: 'Continuity', exact: true })).toBeAttached()
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(1_700)
})

test('renders Timeline with integrated Archive and opens Global Search', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop continuity navigation contract.')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/timeline')
  await expect(page.getByRole('heading', { name: 'Timeline', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Archive', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Archive', exact: true }).click()
  await expect(page).toHaveURL(/view=archive/)
  await expect(page.getByText('Archive · 长期回看')).toBeVisible()

  await page.getByRole('link', { name: 'Search', exact: true }).click()
  await expect(page).toHaveURL(/\/search$/)
  await expect(page.getByRole('heading', { name: 'Search', exact: true })).toBeVisible()
  await page.getByRole('searchbox', { name: '搜索公开内容' }).fill('continuum')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page).toHaveURL(/q=continuum/)
})

test('routes Timeline and Search from the authoritative Mobile Desk', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile Desk continuity routing contract.')
  await page.setViewportSize({ width: 390, height: 667 })
  await page.goto('/')
  const home = page.frameLocator('iframe[title="Keleoz Continuum Home"]')
  await expect(home.getByRole('button', { name: '时间线' })).toBeVisible()
  await expect(home.getByRole('button', { name: '搜索' })).toBeVisible()
  await home.getByRole('button', { name: '时间线' }).click()
  await expect(page).toHaveURL(/\/timeline$/)
  await expect(page.getByRole('heading', { name: 'Timeline', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '打开导航' })).toBeVisible()
  await page.getByRole('button', { name: '打开导航' }).click()
  await expect(page.getByRole('link', { name: 'Search', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
