import { describe, expect, it } from 'vitest'

import { createStoryDocumentGrantManager } from '@/modules/story/document-grant'

const input = {
  mode: 'document' as const,
  sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
  genre: 'fantasy' as const,
  horror: 'no' as const,
  customScript: null,
  messages: Array.from({ length: 24 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
    content: index === 23
      ? '{"story":"结局","choices":[],"isEnding":true,"endingType":"normal","mood":"calm"}'
      : `message-${index}`,
  })),
  documentSoFar: '',
  documentSegment: 0,
}

describe('Story document grant', () => {
  it('releases a failed claim for retry without allowing concurrent replay',()=>{
    const manager=createStoryDocumentGrantManager('secret'),now=new Date()
    const token=manager.issue(input,now),request={...input,documentGrant:token}
    const rollback=manager.claim(request,now)
    expect(rollback).toBeTypeOf('function');expect(manager.claim(request,now)).toBeNull()
    rollback!(now);expect(manager.consume(request,now)).toBe(true);expect(manager.consume(request,now)).toBe(false)
  })
  it('binds a short-lived one-time grant to the exact session, history, and segment', () => {
    const manager = createStoryDocumentGrantManager('0123456789abcdef0123456789abcdef')
    const now = new Date('2026-08-30T01:00:00Z')
    const grant = manager.issue(input, now)

    expect(manager.consume({ ...input, documentGrant: grant }, now)).toBe(true)
    expect(manager.consume({ ...input, documentGrant: grant }, now)).toBe(false)
  })

  it('rejects altered history, segment, and expired grants', () => {
    const now = new Date('2026-08-30T01:00:00Z')
    const altered = createStoryDocumentGrantManager('0123456789abcdef0123456789abcdef')
    const grant = altered.issue(input, now)
    expect(altered.consume({ ...input, documentSoFar: 'forged', documentGrant: grant }, now)).toBe(false)

    const wrongSegment = createStoryDocumentGrantManager('0123456789abcdef0123456789abcdef')
    const segmentGrant = wrongSegment.issue(input, now)
    expect(wrongSegment.consume({ ...input, documentSegment: 1, documentGrant: segmentGrant }, now)).toBe(false)

    const expired = createStoryDocumentGrantManager('0123456789abcdef0123456789abcdef')
    const expiredGrant = expired.issue(input, now)
    expect(expired.consume({ ...input, documentGrant: expiredGrant }, new Date(now.getTime() + 6 * 60_000))).toBe(false)
  })
})
