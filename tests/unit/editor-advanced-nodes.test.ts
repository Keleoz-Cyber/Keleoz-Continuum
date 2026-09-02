import { describe, expect, it } from 'vitest'

import {
  buildCalloutNode,
  buildCollapseNode,
  buildContentReferenceNode,
  buildTocNode,
} from '@/modules/editor/advanced-nodes'

describe('editor advanced node builders', () => {
  it('builds editable callout/collapse shells and a derived TOC marker', () => {
    expect(buildCalloutNode('tip', 'Remember')).toEqual({
      type: 'continuumCallout', attrs: { tone: 'tip', title: 'Remember' },
      content: [{ type: 'paragraph' }],
    })
    expect(buildCollapseNode('Read more')).toEqual({
      type: 'continuumCollapse', attrs: { summary: 'Read more', open: false },
      content: [{ type: 'paragraph' }],
    })
    expect(buildTocNode('Contents')).toEqual({ type: 'continuumToc', attrs: { title: 'Contents', entries: [] } })
  })

  it('keeps public content references stable and storage-free', () => {
    const node = buildContentReferenceNode({
      type: 'project', slug: 'continuum-project', title: 'Continuum Project', summary: 'Ongoing work.',
    })
    expect(node).toEqual({
      type: 'continuumReference',
      attrs: { contentType: 'project', slug: 'continuum-project', title: 'Continuum Project', summary: 'Ongoing work.' },
    })
    expect(JSON.stringify(node)).not.toContain('bodyHtml')
  })
})
