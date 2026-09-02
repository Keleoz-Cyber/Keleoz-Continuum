import { describe, expect, it } from 'vitest'

import { parseAndRenderDocument } from '@/modules/content/document'

describe('advanced structured content blocks', () => {
  it('derives heading anchors and TOC entries while rendering editable callout/collapse/reference content', () => {
    const rendered = parseAndRenderDocument({ type: 'doc', content: [
      { type: 'continuumToc', attrs: { title: 'On this page' } },
      { type: 'heading', attrs: { level: 2, blockId: null }, content: [{ type: 'text', text: 'First Light' }] },
      { type: 'continuumCallout', attrs: { tone: 'tip', title: 'Take note' }, content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'A useful detail.' }] },
      ] },
      { type: 'heading', attrs: { level: 3, blockId: null }, content: [{ type: 'text', text: '第二节' }] },
      { type: 'continuumCollapse', attrs: { summary: '展开阅读', open: false }, content: [
        { type: 'paragraph', content: [{ type: 'text', text: '折叠正文。' }] },
      ] },
      { type: 'continuumReference', attrs: {
        contentType: 'project', slug: 'continuum-project', title: 'Continuum Project', summary: '持续更新中的项目。',
      } },
    ] })

    expect(rendered.html).toContain('data-block-id="first-light"')
    expect(rendered.html).toMatch(/<h2[^>]*\sid="first-light"/)
    expect(rendered.html).toContain('data-block-id="section-2"')
    expect(rendered.html).toContain('class="continuum-toc"')
    expect(rendered.html).toContain('href="#first-light"')
    expect(rendered.html).toContain('href="#section-2"')
    expect(rendered.html).toContain('class="continuum-callout tone-tip"')
    expect(rendered.html).toContain('<details class="continuum-collapse"')
    expect(rendered.html).toContain('<summary>展开阅读</summary>')
    expect(rendered.html).toContain('href="/projects/continuum-project"')
    expect(rendered.plainText).toContain('Take note\nA useful detail.')
    expect(rendered.plainText).toContain('展开阅读\n折叠正文。')
    expect(rendered.plainText).toContain('Continuum Project\n持续更新中的项目。')
  })

  it('deduplicates repeated heading anchors and rejects unsafe reference slugs', () => {
    const rendered = parseAndRenderDocument({ type: 'doc', content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Same' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Same' }] },
    ] })
    expect(rendered.html).toContain('data-block-id="same"')
    expect(rendered.html).toContain('data-block-id="same-2"')

    expect(() => parseAndRenderDocument({ type: 'doc', content: [
      { type: 'continuumReference', attrs: { contentType: 'blog', slug: '../private', title: 'Bad', summary: '' } },
    ] })).toThrow('reference')
  })
})
