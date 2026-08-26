import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

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
