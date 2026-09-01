import {
  continuumAttachmentAttrsSchema,
  continuumAudioAttrsSchema,
  continuumGalleryAttrsSchema,
  continuumImageAttrsSchema,
  continuumVideoAttrsSchema,
} from '@/modules/content/media-nodes'
import type { TiptapNode } from '@/modules/content/schemas'

export type EditorMediaItem = {
  id: string
  altText: string
  originalName: string
  kind: 'image' | 'audio' | 'video' | 'attachment'
}

function requireKind(media: EditorMediaItem, kind: EditorMediaItem['kind']) {
  if (media.kind !== kind) throw new Error(`Expected ${kind} media`)
}

export function buildEditorImageNode(
  media: EditorMediaItem,
  options: { caption: string; size: 'compact' | 'content' | 'wide' },
): TiptapNode {
  requireKind(media, 'image')
  return {
    type: 'continuumImage',
    attrs: continuumImageAttrsSchema.parse({
      mediaId: media.id,
      alt: media.altText,
      caption: options.caption,
      size: options.size,
    }),
  }
}

export function buildEditorGalleryNode(media: EditorMediaItem[]): TiptapNode {
  if (media.length < 2 || media.length > 3) throw new Error('A gallery requires 2 or 3 images')
  if (new Set(media.map((item) => item.id)).size !== media.length) {
    throw new Error('Gallery images must be distinct')
  }
  for (const item of media) requireKind(item, 'image')
  return {
    type: 'continuumGallery',
    attrs: continuumGalleryAttrsSchema.parse({
      items: media.map((item) => ({ mediaId: item.id, alt: item.altText, caption: '' })),
    }),
  }
}

export function buildEditorAudioNode(media: EditorMediaItem, caption: string): TiptapNode {
  requireKind(media, 'audio')
  return { type: 'continuumAudio', attrs: continuumAudioAttrsSchema.parse({ mediaId: media.id, title: media.originalName, caption }) }
}

export function buildEditorVideoNode(media: EditorMediaItem, caption: string): TiptapNode {
  requireKind(media, 'video')
  return { type: 'continuumVideo', attrs: continuumVideoAttrsSchema.parse({ mediaId: media.id, title: media.originalName, caption }) }
}

export function buildEditorAttachmentNode(media: EditorMediaItem, description: string): TiptapNode {
  requireKind(media, 'attachment')
  return { type: 'continuumAttachment', attrs: continuumAttachmentAttrsSchema.parse({ mediaId: media.id, label: media.originalName, description }) }
}
