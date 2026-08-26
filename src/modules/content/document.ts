import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string'
import sanitizeHtml from 'sanitize-html'

import { getContinuumExtensions } from '@/modules/content/extensions'
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

  const separator = node.type === 'doc' || node.type === 'bulletList' || node.type === 'orderedList' ? '\n' : ''
  return (node.content ?? []).map(nodeText).filter(Boolean).join(separator)
}

export function parseAndRenderDocument(input: unknown): RenderedDocument {
  const document = tiptapDocumentSchema.parse(input)
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
    ],
    allowedAttributes: {
      '*': ['data-block-id'],
      a: ['href', 'target', 'rel'],
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
