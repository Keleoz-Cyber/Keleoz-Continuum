import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string'
import sanitizeHtml from 'sanitize-html'

import { getContinuumExtensions } from '@/modules/content/extensions'
import { extractMediaReferences, mediaNodeText } from '@/modules/content/media-nodes'
import { tiptapDocumentSchema, type TiptapDocument, type TiptapNode } from '@/modules/content/schemas'

export type RenderedDocument = {
  document: TiptapDocument
  html: string
  plainText: string
}

function nodeText(node: TiptapNode): string {
  if (typeof node.text === 'string') {
    return node.text
  }

  const mediaText = mediaNodeText(node)
  if (mediaText !== null) return mediaText

  const separator = node.type === 'doc' || node.type === 'bulletList' || node.type === 'orderedList' ? '\n' : ''
  return (node.content ?? []).map(nodeText).filter(Boolean).join(separator)
}

export function parseAndRenderDocument(input: unknown): RenderedDocument {
  const document = tiptapDocumentSchema.parse(input)
  extractMediaReferences(document)
  const unsafeHtml = renderToHTMLString({
    content: document,
    extensions: getContinuumExtensions(),
  })
  const html = sanitizeHtml(unsafeHtml, {
    allowedTags: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'strong',
      'em',
      's',
      'del',
      'a',
      'br',
      'hr',
      'figure',
      'picture',
      'source',
      'img',
      'figcaption',
      'div',
    ],
    allowedAttributes: {
      '*': ['data-block-id', 'data-continuum-image', 'data-continuum-gallery', 'data-media-id', 'class'],
      a: ['href', 'target', 'rel'],
      source: ['srcset', 'type'],
      img: ['src', 'alt', 'loading', 'decoding'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  })

  return {
    document,
    html,
    plainText: nodeText(document).trim(),
  }
}
