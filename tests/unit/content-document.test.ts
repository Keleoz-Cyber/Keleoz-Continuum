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

  it('renders stable media-id image and gallery blocks without storage keys or cloud domains', () => {
    const first = '4415fc7c-9e85-4b17-a791-f21990c98e38'
    const second = 'bd05aa1d-806a-4bc9-945d-75355495f81b'
    const rendered = parseAndRenderDocument({
      type: 'doc',
      content: [
        { type: 'continuumImage', attrs: { mediaId: first, alt: '雾窗 <script>', caption: '第一束光', size: 'wide' } },
        { type: 'continuumGallery', attrs: { items: [
          { mediaId: first, alt: '蓝色雾窗', caption: '' },
          { mediaId: second, alt: '玻璃上的水滴', caption: 'Rain' },
        ] } },
      ],
    })

    expect(rendered.html).toContain(`/media/${first}/large.avif`)
    expect(rendered.html).toContain(`/media/${first}/large.webp`)
    expect(rendered.html).toContain(`/media/${second}/card.webp`)
    expect(rendered.html).toContain('class="continuum-media continuum-media-wide"')
    expect(rendered.html).toContain('class="continuum-gallery n2"')
    expect(rendered.html).not.toContain('<script>')
    expect(rendered.html).not.toContain('storage_key')
    expect(rendered.html).not.toContain('light-cos.com')
    expect(rendered.plainText).toBe('第一束光\n蓝色雾窗\nRain')
  })

  it('rejects malformed media ids and galleries larger than the source three-image contract', () => {
    expect(() => parseAndRenderDocument({ type: 'doc', content: [
      { type: 'continuumImage', attrs: { mediaId: '../local.webp', alt: '', caption: '', size: 'content' } },
    ] })).toThrow('media')
    expect(() => parseAndRenderDocument({ type: 'doc', content: [
      { type: 'continuumGallery', attrs: { items: [1, 2, 3, 4].map((index) => ({
        mediaId: `4415fc7c-9e85-4b17-a791-f21990c98e3${index}`,
        alt: '', caption: '',
      })) } },
    ] })).toThrow('gallery')
  })

  it('renders safe audio, video, and attachment blocks from media ids', () => {
    const audioId = '4415fc7c-9e85-4b17-a791-f21990c98e38'
    const videoId = 'bd05aa1d-806a-4bc9-945d-75355495f81b'
    const fileId = '903a0c46-a5f0-46ed-9875-80a46c5c9b31'
    const rendered = parseAndRenderDocument({ type: 'doc', content: [
      { type: 'continuumAudio', attrs: { mediaId: audioId, title: 'Rain room', caption: '夜雨环境声' } },
      { type: 'continuumVideo', attrs: { mediaId: videoId, title: 'Window study', caption: '短片说明' } },
      { type: 'continuumAttachment', attrs: { mediaId: fileId, label: 'Download notes.pdf', description: '拍摄说明' } },
    ] })

    expect(rendered.html).toContain(`<audio controls preload="metadata" src="/media/${audioId}/original"`)
    expect(rendered.html).toContain(`<video controls preload="metadata" src="/media/${videoId}/original"`)
    expect(rendered.html).toContain(`href="/media/${fileId}/original"`)
    expect(rendered.html).toContain('download="Download notes.pdf"')
    expect(rendered.html).toContain('</audio><figcaption>夜雨环境声</figcaption>')
    expect(rendered.html).toContain('</video><figcaption>短片说明</figcaption>')
    expect(rendered.plainText).toBe('夜雨环境声\n短片说明\nDownload notes.pdf\n拍摄说明')
    expect(rendered.html).not.toContain('storage_key')
  })

  it('renders task-list state and keeps each task in searchable plain text', () => {
    const rendered = parseAndRenderDocument({ type: 'doc', content: [
      { type: 'taskList', content: [
        { type: 'taskItem', attrs: { checked: true }, content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Finished item' }] },
        ] },
        { type: 'taskItem', attrs: { checked: false }, content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Pending item' }] },
        ] },
      ] },
    ] })

    expect(rendered.html).toContain('class="continuum-task-list"')
    expect(rendered.html).toContain('data-checked="true"')
    expect(rendered.html).toContain('data-checked="false"')
    expect(rendered.html).toContain('type="checkbox"')
    expect(rendered.html).toContain('disabled')
    expect(rendered.plainText).toBe('Finished item\nPending item')
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
