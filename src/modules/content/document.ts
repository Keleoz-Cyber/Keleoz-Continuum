import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string'
import sanitizeHtml from 'sanitize-html'

import { tiptapDocumentSchema, type TiptapDocument, type TiptapNode } from '@/modules/content/schemas'

export type RenderedDocument = {
  document: TiptapDocument
  html: string
  plainText: string
}

const blockTypes = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'codeBlock',
]

const ContinuumBlockId = Extension.create({
  name: 'continuumBlockId',
  addGlobalAttributes() {
    return [
      {
        types: blockTypes,
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-block-id'),
            renderHTML: (attributes) =>
              typeof attributes.blockId === 'string' && attributes.blockId
                ? { 'data-block-id': attributes.blockId }
                : {},
          },
        },
      },
    ]
  },
})

export function getContinuumExtensions() {
  return [
    StarterKit.configure({
      link: {
        openOnClick: false,
        autolink: false,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener noreferrer' },
      },
    }),
    ContinuumBlockId,
  ]
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
