import { describe, expect, it } from 'vitest'

import {
  buildEditorAttachmentNode,
  buildEditorAudioNode,
  buildEditorGalleryNode,
  buildEditorImageNode,
  buildEditorVideoNode,
} from '@/modules/editor/media-nodes'

const first = { id: '4415fc7c-9e85-4b17-a791-f21990c98e38', altText: '雾窗', originalName: 'window.jpg', kind: 'image' as const }
const second = { id: 'bd05aa1d-806a-4bc9-945d-75355495f81b', altText: '水滴', originalName: 'rain.jpg', kind: 'image' as const }

describe('editor media node builders', () => {
  it('stores only media identity and presentation metadata in an image node', () => {
    const node = buildEditorImageNode(first, { caption: 'First light', size: 'wide' })

    expect(node).toEqual({
      type: 'continuumImage',
      attrs: { mediaId: first.id, alt: '雾窗', caption: 'First light', size: 'wide' },
    })
    expect(JSON.stringify(node)).not.toContain('/media/')
    expect(JSON.stringify(node)).not.toContain('window.jpg')
  })

  it('builds a source-bounded gallery from two or three distinct ready items', () => {
    expect(buildEditorGalleryNode([first, second])).toEqual({
      type: 'continuumGallery',
      attrs: { items: [
        { mediaId: first.id, alt: '雾窗', caption: '' },
        { mediaId: second.id, alt: '水滴', caption: '' },
      ] },
    })
    expect(() => buildEditorGalleryNode([first])).toThrow('2 or 3')
    expect(() => buildEditorGalleryNode([first, first])).toThrow('distinct')
  })

  it('builds typed audio, video, and attachment nodes without original object URLs', () => {
    const audio = { ...first, kind: 'audio' as const, originalName: 'rain.wav' }
    const video = { ...second, kind: 'video' as const, originalName: 'window.mp4' }
    const attachment = { ...first, kind: 'attachment' as const, originalName: 'notes.pdf' }
    expect(buildEditorAudioNode(audio, 'Night rain')).toEqual({ type: 'continuumAudio', attrs: { mediaId: audio.id, title: 'rain.wav', caption: 'Night rain' } })
    expect(buildEditorVideoNode(video, 'Window study')).toEqual({ type: 'continuumVideo', attrs: { mediaId: video.id, title: 'window.mp4', caption: 'Window study' } })
    expect(buildEditorAttachmentNode(attachment, 'Field notes')).toEqual({ type: 'continuumAttachment', attrs: { mediaId: attachment.id, label: 'notes.pdf', description: 'Field notes' } })
    expect(() => buildEditorAudioNode(first, '')).toThrow('audio')
    expect(JSON.stringify(buildEditorAttachmentNode(attachment, ''))).not.toContain('/media/')
  })
})
