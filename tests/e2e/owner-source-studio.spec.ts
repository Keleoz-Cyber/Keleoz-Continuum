import { expect, test } from '@playwright/test'

test('keeps Owner tools private and presents the source-style Studio surfaces', async ({ page }) => {
  const username = process.env.E2E_OWNER_USERNAME
  const password = process.env.E2E_OWNER_PASSWORD
  test.skip(!username || !password, 'Set E2E_OWNER_USERNAME and E2E_OWNER_PASSWORD for local Owner acceptance.')
  test.setTimeout(60_000)
  const title = `Rift browser check ${Date.now()}`
  const memoryTitle = `Memory browser check ${Date.now()}`
  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto('/studio/login')
  await page.getByLabel('Username').fill(username!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: 'Enter Studio' }).click()

  await expect(page).toHaveURL(/\/studio$/)
  await expect(page.locator('.source-studio')).toBeVisible()
  const navigation = page.getByRole('navigation', { name: 'Studio navigation' })
  for (const label of ['Studio', 'Chat', 'Memory', 'System']) {
    await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible()
  }
  await expect(page.locator('.studio-inbox').first()).toHaveCSS('background-color', 'rgba(247, 251, 255, 0.58)')
  await page.screenshot({ path: 'output/playwright/source-studio-overview.png', fullPage: true })

  await page.locator('.studio-create-form input[name="title"]').fill(title)
  await page.locator('.studio-create-form select[name="type"]').selectOption('blog')
  await page.getByRole('button', { name: 'Create draft' }).click()
  await expect(page).toHaveURL(/\/studio\/content\/[0-9a-f-]+$/)
  await expect(page.locator('.source-rift-editor')).toBeVisible()
  await expect(page.locator('.source-rift-sidebar-head')).toContainText('writing')
  const editorGrid = await page.locator('.source-rift-editor').evaluate((element) => getComputedStyle(element).gridTemplateColumns)
  expect(editorGrid).toContain('260px')
  await page.screenshot({ path: 'output/playwright/source-rift-editor.png', fullPage: true })

  await page.goto('/studio/chat')
  await expect(page.locator('.source-chat-shell')).toBeVisible()
  await expect(page.getByText('Private AI dialogue')).toBeVisible()
  await page.getByLabel('Search current conversation').fill('rain')
  await page.getByLabel('Search current conversation').press('Enter')
  await expect(page).toHaveURL(/q=rain/)
  await page.screenshot({ path: 'output/playwright/source-owner-chat.png', fullPage: true })

  await page.goto('/studio/memory')
  await expect(page.locator('.source-memory-sky')).toBeVisible()
  await expect(page.locator('.source-auto-memory')).toBeVisible()
  await page.screenshot({ path: 'output/playwright/source-owner-memory.png', fullPage: true })
  await page.getByText('＋ 新记忆', { exact: true }).click()
  const memoryForm = page.locator('.source-memory-index header details[open] form')
  await memoryForm.getByLabel('标题').fill(memoryTitle)
  await memoryForm.getByLabel('内容').fill('A temporary browser-verification memory.')
  await memoryForm.getByRole('button', { name: '保存记忆' }).click()
  const memoryCard = page.locator('.source-memory-card').filter({ hasText: memoryTitle })
  await expect(memoryCard).toBeVisible()
  await memoryCard.getByText(memoryTitle).click()
  await memoryCard.getByRole('button', { name: '删除', exact: true }).click()
  await expect(memoryCard).toHaveCount(0)

  await page.goto(`/studio?q=${encodeURIComponent(title)}`)
  const row = page.locator('.studio-content-row').filter({ hasText: title })
  await row.getByRole('button', { name: 'Archive' }).click()
  await expect(page).toHaveURL(/content=archived/)
  await page.goto('/studio?status=archived')
  const archivedRow = page.locator('.studio-content-row').filter({ hasText: title })
  await archivedRow.getByText('Permanent delete').click()
  await archivedRow.getByLabel('Owner password').fill(password!)
  await archivedRow.getByRole('button', { name: 'Delete permanently' }).click()
  await expect(page).toHaveURL(/content=deleted/)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const source = page.frameLocator('iframe[title="Keleoz Continuum Home"]')
  await expect(source.locator('#sec-profile-cal .sb-app[data-page="blog"]')).toBeVisible()
  await expect(source.locator('#sec-profile-cal .sb-app[data-page="memory"] .sb-t')).toHaveText('时间线')
  await expect(source.locator('#sec-profile-cal .sb-app[data-page="chat"]')).toBeHidden()
  await expect(source.locator('#sec-profile-cal .sb-app[data-page="icode"]')).toBeHidden()
  await expect(source.locator('#sb-setapp')).toBeHidden()
  await expect(source.locator('#sb-frdapp')).toBeHidden()
  await expect(source.locator('#ib-splash')).toHaveCount(0, { timeout: 10_000 })
  await page.screenshot({ path: 'output/playwright/source-public-mobile.png', fullPage: true })
})
