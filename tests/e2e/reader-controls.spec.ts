import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

import { expect, test, type Page } from '@playwright/test'

const requireFromTsx = createRequire(import.meta.resolve('tsx'))
const { build } = requireFromTsx('esbuild') as {
  build: (options: object) => Promise<{ outputFiles: Array<{ text: string }> }>
}
let bundle: string
test.use({ channel: 'chrome' })

test.beforeAll(async () => {
  // This mounts the real component in a synthetic article, without a server or database.
  const result = await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
        import {ReadingProgress} from './src/modules/content/reading-progress';
        createRoot(document.getElementById('root')).render(<main className="source-reader-page">
          <div id="blog-read-view" className="fontsize-m"><ReadingProgress/>
            <article className="post-view"><h1 className="post-view-title">Synthetic reader fixture</h1>
              <div id="continuum-article" className="post-view-content">
                <p id="first">Tea, tea, TEA.</p><p id="last" style={{marginTop: '120vh'}}>Another tea.</p>
              </div>
            </article>
          </div></main>);`,
      resolveDir: process.cwd(), loader: 'tsx',
    },
    bundle: true, write: false, platform: 'browser', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  })
  bundle = result.outputFiles[0].text
})

async function openFixture(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: 844 })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>')
  await page.addStyleTag({ content: readFileSync('src/app/source-public.css', 'utf8') })
  await page.addScriptTag({ content: bundle })
  await page.locator('#continuum-article').waitFor({ timeout: 2000 }).catch(error => {
    throw new Error(`Synthetic fixture failed to mount: ${errors.join('; ')}; ${error.message}`)
  })
  return page
}

async function highlightedMatch(page: Page) {
  return page.evaluate(() => {
    const highlight = CSS.highlights.get('continuum-reader-match')
    const range = highlight ? Array.from(highlight)[0] as Range : null
    return range ? { parent: range.startContainer.parentElement?.id, start: range.startOffset, end: range.endOffset, text: range.toString() } : null
  })
}

test.describe('public reader controls on a synthetic article', () => {
  for (const width of [1440, 390]) {
    test(`changes the actual article through all original font sizes at ${width}px`, async ({ page }) => {
      await openFixture(page, width)
      for (const [size, pixels] of [['s', 14.56], ['l', 18.88], ['m', 16]] as const) {
        await page.locator(`.read-fontsize-btn.fs-${size}`).click()
        expect(await page.locator('#continuum-article').evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(pixels, 2)
        expect(await page.locator('#blog-read-view').getAttribute('class')).toBe(`fontsize-${size}`)
      }
    })
  }

  test('selects first, advances through repeated matches in one node, and wraps both directions', async ({ page }) => {
      await openFixture(page)
      await page.getByRole('textbox', { name: '搜索本文' }).fill('tea')
      expect(await page.locator('.brv-search-count').textContent()).toBe('1/4')
      expect(await highlightedMatch(page)).toEqual({ parent: 'first', start: 0, end: 3, text: 'Tea' })
      await page.getByRole('button', { name: '下一处' }).click()
      expect(await highlightedMatch(page)).toEqual({ parent: 'first', start: 5, end: 8, text: 'tea' })
      await page.getByRole('textbox', { name: '搜索本文' }).press('Enter')
      expect(await highlightedMatch(page)).toEqual({ parent: 'first', start: 10, end: 13, text: 'TEA' })
      await page.getByRole('button', { name: '下一处' }).click()
      expect(await highlightedMatch(page)).toEqual({ parent: 'last', start: 8, end: 11, text: 'tea' })
      expect(await page.locator('.brv-search-count').textContent()).toBe('4/4')
      await page.getByRole('button', { name: '下一处' }).click()
      expect(await page.locator('.brv-search-count').textContent()).toBe('1/4')
      await page.getByRole('textbox', { name: '搜索本文' }).press('Shift+Enter')
      expect(await page.locator('.brv-search-count').textContent()).toBe('4/4')
      await page.getByRole('textbox', { name: '搜索本文' }).fill('missing')
      expect(await page.locator('.brv-search-count').textContent()).toBe('0/0')
      expect(await highlightedMatch(page)).toBeNull()
      await page.getByRole('textbox', { name: '搜索本文' }).fill('')
      expect(await page.locator('.brv-search-count').textContent()).toBe('')
  })
})
