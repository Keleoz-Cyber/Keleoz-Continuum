import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })

test('renders Projects, Moments, and About with one consistent Desktop source navigation', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop source navigation contract.')
  await page.setViewportSize({ width: 1440, height: 900 })

  for (const [path, heading, current] of [
    ['/projects', 'Projects', 'Projects'],
    ['/moments', 'Moments', 'Moments'],
    ['/about', 'About', 'About'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    const nav = page.getByRole('navigation', { name: '主导航' })
    await expect(nav.getByRole('link', { name: 'Blog', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Projects', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Moments', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: current, exact: true })).toHaveClass(/active/)
  }
})

test('routes Projects, Moments, and About from the authoritative Mobile Desk', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile Desk routing contract.')
  await page.setViewportSize({ width: 390, height: 667 })
  await page.goto('/')
  const home = page.frameLocator('iframe[title="Keleoz Continuum Home"]')

  await expect(home.getByRole('button', { name: '项目' })).toBeVisible()
  await expect(home.getByRole('button', { name: '动态' })).toBeVisible()
  await expect(home.getByRole('button', { name: '名片' })).toBeVisible()

  await home.getByRole('button', { name: '项目' }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
