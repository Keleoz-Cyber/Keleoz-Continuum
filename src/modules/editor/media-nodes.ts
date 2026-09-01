import {
  continuumGalleryAttrsSchema,
  continuumImageAttrsSchema,
} from '@/modules/content/media-nodes'
import type { TiptapNode } from '@/modules/content/schemas'

export type EditorMediaItem = { id: string; altText: string; originalName: string }

export function buildEditorImageNode(
  media: EditorMediaItem,
  options: { caption: string; size: 'compact' | 'content' | 'wide' },
): TiptapNode {
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
  return {
    type: 'continuumGallery',
    attrs: continuumGalleryAttrsSchema.parse({
      items: media.map((item) => ({ mediaId: item.id, alt: item.altText, caption: '' })),
    }),
  }
}
