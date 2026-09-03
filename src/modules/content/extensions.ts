import { Extension, Node } from '@tiptap/core'
import type { DOMOutputSpec } from '@tiptap/pm/model'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import StarterKit from '@tiptap/starter-kit'

import {
  continuumCalloutAttrsSchema,
  continuumCollapseAttrsSchema,
  continuumReferenceAttrsSchema,
  continuumTocAttrsSchema,
  publicReferencePath,
} from '@/modules/content/advanced-nodes'
import {
  continuumAttachmentAttrsSchema,
  continuumAudioAttrsSchema,
  continuumGalleryAttrsSchema,
  continuumImageAttrsSchema,
  continuumVideoAttrsSchema,
} from '@/modules/content/media-nodes'

const blockTypes = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'taskList',
  'taskItem',
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
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute('data-block-id'),
            renderHTML: (attributes) =>
              typeof attributes.blockId === 'string' && attributes.blockId
                ? { 'data-block-id': attributes.blockId, id: attributes.blockId }
                : {},
          },
        },
      },
    ]
  },
})

function mediaPicture(mediaId: string, alt: string, variant: 'card' | 'large'): DOMOutputSpec {
  return ['picture', {},
    ['source', { srcset: `/media/${mediaId}/${variant}.avif`, type: 'image/avif' }],
    ['img', { src: `/media/${mediaId}/${variant}.webp`, alt, loading: 'lazy', decoding: 'async' }],
  ]
}

const ContinuumImage = Node.create({
  name: 'continuumImage',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      mediaId: { default: null }, alt: { default: '' }, caption: { default: '' }, size: { default: 'content' },
    }
  },
  parseHTML() { return [{ tag: 'figure[data-continuum-image]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumImageAttrsSchema.parse(HTMLAttributes)
    const children: DOMOutputSpec[] = [mediaPicture(attrs.mediaId, attrs.alt, 'large')]
    if (attrs.caption) children.push(['figcaption', {}, attrs.caption])
    return ['figure', {
      class: `continuum-media continuum-media-${attrs.size}`,
      'data-continuum-image': '',
      'data-media-id': attrs.mediaId,
    }, ...children]
  },
})

const ContinuumGallery = Node.create({
  name: 'continuumGallery',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() { return { items: { default: [] } } },
  parseHTML() { return [{ tag: 'div[data-continuum-gallery]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumGalleryAttrsSchema.parse(HTMLAttributes)
    const figures = attrs.items.map((item): DOMOutputSpec => {
      const children: DOMOutputSpec[] = [mediaPicture(item.mediaId, item.alt, 'card')]
      if (item.caption) children.push(['figcaption', {}, item.caption])
      return ['figure', { 'data-media-id': item.mediaId }, ...children]
    })
    return ['div', { class: `continuum-gallery n${attrs.items.length}`, 'data-continuum-gallery': '' }, ...figures]
  },
})

const ContinuumAudio = Node.create({
  name: 'continuumAudio', group: 'block', atom: true, selectable: true, draggable: true,
  addAttributes() { return { mediaId: { default: null }, title: { default: '' }, caption: { default: '' } } },
  parseHTML() { return [{ tag: 'figure[data-continuum-audio]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumAudioAttrsSchema.parse(HTMLAttributes)
    const children: DOMOutputSpec[] = []
    if (attrs.title) children.push(['strong', {}, attrs.title])
    children.push(['audio', { controls: '', preload: 'metadata', src: `/media/${attrs.mediaId}/original` }, ''])
    if (attrs.caption) children.push(['figcaption', {}, attrs.caption])
    return ['figure', { class: 'continuum-audio', 'data-continuum-audio': '', 'data-media-id': attrs.mediaId }, ...children]
  },
})

const ContinuumVideo = Node.create({
  name: 'continuumVideo', group: 'block', atom: true, selectable: true, draggable: true,
  addAttributes() { return { mediaId: { default: null }, title: { default: '' }, caption: { default: '' } } },
  parseHTML() { return [{ tag: 'figure[data-continuum-video]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumVideoAttrsSchema.parse(HTMLAttributes)
    const children: DOMOutputSpec[] = []
    if (attrs.title) children.push(['strong', {}, attrs.title])
    children.push(['video', { controls: '', preload: 'metadata', src: `/media/${attrs.mediaId}/original` }, ''])
    if (attrs.caption) children.push(['figcaption', {}, attrs.caption])
    return ['figure', { class: 'continuum-video', 'data-continuum-video': '', 'data-media-id': attrs.mediaId }, ...children]
  },
})

const ContinuumAttachment = Node.create({
  name: 'continuumAttachment', group: 'block', atom: true, selectable: true, draggable: true,
  addAttributes() { return { mediaId: { default: null }, label: { default: 'Download file' }, description: { default: '' } } },
  parseHTML() { return [{ tag: 'a[data-continuum-attachment]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumAttachmentAttrsSchema.parse(HTMLAttributes)
    return ['a', {
      class: 'continuum-attachment',
      'data-continuum-attachment': '',
      'data-media-id': attrs.mediaId,
      href: `/media/${attrs.mediaId}/original`,
      download: attrs.label,
    }, ['strong', {}, attrs.label], attrs.description ? ['span', {}, attrs.description] : ['span', {}, '']]
  },
})

const ContinuumCallout = Node.create({
  name: 'continuumCallout', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { tone: { default: 'note' }, title: { default: 'Note' } } },
  parseHTML() { return [{ tag: 'aside[data-continuum-callout]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumCalloutAttrsSchema.parse(HTMLAttributes)
    return ['aside', { class: `continuum-callout tone-${attrs.tone}`, 'data-continuum-callout': '' },
      ['strong', {}, attrs.title], ['div', { class: 'continuum-callout-body' }, 0]]
  },
})

const ContinuumCollapse = Node.create({
  name: 'continuumCollapse', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { summary: { default: 'Read more' }, open: { default: false } } },
  parseHTML() { return [{ tag: 'details[data-continuum-collapse]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumCollapseAttrsSchema.parse(HTMLAttributes)
    return ['details', {
      class: 'continuum-collapse', 'data-continuum-collapse': '', ...(attrs.open ? { open: '' } : {}),
    }, ['summary', {}, attrs.summary], ['div', { class: 'continuum-collapse-body' }, 0]]
  },
})

const ContinuumReference = Node.create({
  name: 'continuumReference', group: 'block', atom: true, selectable: true, draggable: true,
  addAttributes() {
    return { contentType: { default: 'blog' }, slug: { default: null }, title: { default: 'Reference' }, summary: { default: '' } }
  },
  parseHTML() { return [{ tag: 'a[data-continuum-reference]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumReferenceAttrsSchema.parse(HTMLAttributes)
    return ['a', {
      class: `continuum-reference type-${attrs.contentType}`,
      'data-continuum-reference': '',
      href: publicReferencePath(attrs.contentType, attrs.slug),
    }, ['small', {}, attrs.contentType], ['strong', {}, attrs.title], ['span', {}, attrs.summary]]
  },
})

const ContinuumToc = Node.create({
  name: 'continuumToc', group: 'block', atom: true, selectable: true,
  addAttributes() { return { title: { default: 'On this page' }, entries: { default: [] } } },
  parseHTML() { return [{ tag: 'nav[data-continuum-toc]' }] },
  renderHTML({ HTMLAttributes }) {
    const attrs = continuumTocAttrsSchema.parse(HTMLAttributes)
    return ['nav', { class: 'continuum-toc', 'data-continuum-toc': '', 'aria-label': attrs.title },
      ['strong', {}, attrs.title], ['ol', {}, ...attrs.entries.map((entry): DOMOutputSpec =>
        ['li', { class: `level-${entry.level}` }, ['a', { href: `#${entry.id}` }, entry.title]])]]
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
    TaskList.configure({ HTMLAttributes: { class: 'continuum-task-list' } }),
    TaskItem.configure({ nested: true, HTMLAttributes: { class: 'continuum-task-item' } }),
    ContinuumBlockId,
    ContinuumImage,
    ContinuumGallery,
    ContinuumAudio,
    ContinuumVideo,
    ContinuumAttachment,
    ContinuumCallout,
    ContinuumCollapse,
    ContinuumReference,
    ContinuumToc,
  ]
}
