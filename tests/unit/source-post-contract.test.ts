import { describe, expect, it } from 'vitest'
import { sourcePostSchema, sourceDocumentText, isSourceEditable } from '@/modules/source-native/posts'

describe('source writer content adaptation', () => {
  it('supports all public content types without treating ICode projects as content', () => {
    for (const type of ['blog', 'project', 'moment', 'page']) {
      expect(sourcePostSchema.parse({ id: 'post_new', title: 'Title', content: 'Body', type }).type).toBe(type)
    }
    expect(sourcePostSchema.safeParse({ id: 'post_new', title: '', content: '', type: 'icode' }).success).toBe(false)
  })
  it('adapts plain paragraphs losslessly including empty paragraphs and hard breaks', () => {
    const doc = { type: 'doc' as const, content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'One' }, { type: 'hardBreak' }, { type: 'text', text: 'Two' }] },
      { type: 'paragraph' }, { type: 'paragraph', content: [{ type: 'text', text: 'Three' }] },
    ] }
    expect(isSourceEditable(doc)).toBe(true)
    expect(sourceDocumentText(doc)).toBe('One\nTwo\n\n\n\nThree')
  })
  it('never flattens rich nodes or inline formatting into the original textarea', () => {
    expect(isSourceEditable({ type: 'doc', content: [{ type: 'continuumImage', attrs: {} }] })).toBe(false)
    expect(isSourceEditable({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bold', marks: [{ type: 'bold' }] }] }] })).toBe(false)
    expect(isSourceEditable({ type: 'doc', attrs: { sourceFormat: 'md', sourceText: 'stale' }, content: [{ type: 'continuumImage' }] })).toBe(false)
  })
  it('preserves authoritative Markdown whitespace', () => {
    const doc = { type: 'doc' as const, attrs: { sourceFormat: 'md', sourceText: '\n**Bold**\n\n' }, content: [{ type: 'paragraph' }] }
    expect(isSourceEditable(doc)).toBe(true)
    expect(sourceDocumentText(doc)).toBe('\n**Bold**\n\n')
  })
})
