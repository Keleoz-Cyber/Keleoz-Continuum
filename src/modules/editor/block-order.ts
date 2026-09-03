import type { TiptapDocument } from '@/modules/content/schemas'

export type TopLevelBlockOffset = { offset: number; nodeSize: number }

export function topLevelBlockIndexAtPosition(blocks: TopLevelBlockOffset[], position: number) {
  const index = blocks.findIndex((block) => position >= block.offset + 1 && position < block.offset + block.nodeSize)
  return index >= 0 ? index : null
}

export function moveTopLevelDocumentBlock(
  document: TiptapDocument,
  index: number,
  direction: -1 | 1,
): TiptapDocument {
  const content = document.content
  if (!content) return document
  const target = index + direction
  if (index < 0 || index >= content.length || target < 0 || target >= content.length) return document
  const reordered = [...content]
  const [selected] = reordered.splice(index, 1)
  if (!selected) return document
  reordered.splice(target, 0, selected)
  return { ...document, content: reordered }
}
