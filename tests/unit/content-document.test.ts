import { describe, expect, it } from 'vitest'

import { parseAndRenderDocument } from '@/modules/content/document'
import { normalizeSlug, PublishedSlugChangeError, resolveStableSlug } from '@/modules/content/slug'

const document = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2, blockId: 'arrival', onclick: 'alert(1)' },
      content: [{ type: 'text', text: 'Arrival' }],
    },
    {
      type: 'paragraph',
      attrs: { blockId: 'p-1' },
      content: [
        { type: 'text', text: 'First light.' },
        {
          type: 'text',
          text: ' unsafe',
          marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
        },
      ],
    },
  ],
}

describe('structured content document', () => {
  it('preserves block ids while sanitizing rendered HTML', () => {
    const rendered = parseAndRenderDocument(document)

    expect(rendered.html).toContain('data-block-id="arrival"')
    expect(rendered.html).not.toContain('onclick')
    expect(rendered.html).not.toContain('javascript:')
    expect(rendered.html).not.toContain('<script')
    expect(rendered.plainText).toBe('Arrival\nFirst light. unsafe')
  })

  it('normalizes a human title into a stable slug', () => {
    expect(normalizeSlug('  First Light  ')).toBe('first-light')
  })

  it('rejects an empty slug', () => {
    expect(() => normalizeSlug('---')).toThrow('slug')
  })

  it('does not silently change a published slug', () => {
    expect(() =>
      resolveStableSlug({
        currentSlug: 'first-light',
        requestedSlug: 'second-light',
        hasPublication: true,
      }),
    ).toThrow(PublishedSlugChangeError)
  })
})
