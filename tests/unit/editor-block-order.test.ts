import { describe, expect, it } from 'vitest'

import {
  moveTopLevelDocumentBlock,
  topLevelBlockIndexAtPosition,
} from '@/modules/editor/block-order'

const document = {
  type: 'doc' as const,
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
    { type: 'continuumCallout', attrs: { tone: 'note', title: 'Nested' }, content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
    ] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Third' }] },
  ],
}

describe('editor top-level block ordering', () => {
  it('moves the selected parent block without mutating its nested content', () => {
    const moved = moveTopLevelDocumentBlock(document, 1, -1)
    expect(moved.content?.map((node) => node.type)).toEqual(['continuumCallout', 'paragraph', 'paragraph'])
    expect(moved.content?.[0]).toEqual(document.content[1])
    expect(document.content.map((node) => node.type)).toEqual(['paragraph', 'continuumCallout', 'paragraph'])
  })

  it('returns the same document when movement crosses a boundary', () => {
    expect(moveTopLevelDocumentBlock(document, 0, -1)).toBe(document)
    expect(moveTopLevelDocumentBlock(document, 2, 1)).toBe(document)
  })

  it('maps a ProseMirror selection position to the containing top-level block', () => {
    const blocks = [{ offset: 0, nodeSize: 3 }, { offset: 3, nodeSize: 7 }, { offset: 10, nodeSize: 3 }]
    expect(topLevelBlockIndexAtPosition(blocks, 1)).toBe(0)
    expect(topLevelBlockIndexAtPosition(blocks, 6)).toBe(1)
    expect(topLevelBlockIndexAtPosition(blocks, 12)).toBe(2)
    expect(topLevelBlockIndexAtPosition(blocks, 99)).toBeNull()
  })
})
