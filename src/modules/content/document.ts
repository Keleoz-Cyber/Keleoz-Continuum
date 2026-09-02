import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string'
import sanitizeHtml from 'sanitize-html'

import { getContinuumExtensions } from '@/modules/content/extensions'
import { advancedNodeText, prepareAdvancedDocument } from '@/modules/content/advanced-nodes'
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

  const advancedText = advancedNodeText(node)
  if (advancedText !== null) {
    const childText = (node.content ?? []).map(nodeText).filter(Boolean).join('\n')
    return [advancedText, childText].filter(Boolean).join('\n')
  }

  const separator = node.type === 'doc' || node.type === 'bulletList' || node.type === 'orderedList' ? '\n' : ''
  return (node.content ?? []).map(nodeText).filter(Boolean).join(separator)
}

export function parseAndRenderDocument(input: unknown): RenderedDocument {
  const document = prepareAdvancedDocument(tiptapDocumentSchema.parse(input))
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
      'audio',
      'video',
      'span',
      'aside',
      'details',
      'summary',
      'nav',
    ],
    allowedAttributes: {
      '*': ['id', 'data-block-id', 'data-continuum-image', 'data-continuum-gallery', 'data-continuum-audio', 'data-continuum-video', 'data-continuum-attachment', 'data-continuum-callout', 'data-continuum-collapse', 'data-continuum-reference', 'data-continuum-toc', 'data-media-id', 'class', 'aria-label'],
      a: ['href', 'target', 'rel', 'download'],
      source: ['srcset', 'type'],
      img: ['src', 'alt', 'loading', 'decoding'],
      audio: ['src', 'controls', 'preload'],
      video: ['src', 'controls', 'preload'],
      details: ['open'],
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
