import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { originalEditorDocument } from '@/modules/source-native/editor-document'
it('retains original Desktop writer markup, palette and SVG while disabling local handlers',()=>{
  const source=readFileSync('upstream/InternalBeyond-Desktop/InternalBeyond.html','utf8')
  const html=originalEditorDocument(source,false)
  expect(html).toContain('class="rift-editor"')
  expect(html).toContain('width:260px;min-width:260px')
  expect(html).toContain('data-source-command="ul"')
  expect(html).toContain('M6.4 4.5h6.2')
  expect(html).toContain('class="page-overlay show"')
  expect(html).not.toMatch(/\sonclick=/)
  expect(html).not.toContain('<script')
  expect(html).not.toContain('id="chat-panel"')
})
it('retains the separate original Mobile writer and excludes the Desktop layout',()=>{
  const html=originalEditorDocument(readFileSync('upstream/InternalBeyond-Mobile/index.html','utf8'),true)
  expect(html).toContain('id="sub-blog-editor"')
  expect(html).toContain('class="ed-title-l"')
  expect(html).toContain('.ed-title-l{border:none;background:none;outline:none;')
  expect(html).toContain('id="m-ed-save"')
  expect(html).not.toContain('<div class="rift-editor"')
})
