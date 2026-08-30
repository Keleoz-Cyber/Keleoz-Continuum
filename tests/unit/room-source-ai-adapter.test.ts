import { describe, expect, it } from 'vitest'

import {
  advanceStoryDocumentSnapshot,
  createStoryDocumentSnapshot,
  documentContinuationFromSourceMessages,
  roomAiFeatureForAction,
  roomFeatureHasCompanion,
  storyModeForSourceCall,
} from '@/modules/room/source-ai-adapter'

describe('Room immutable-source AI feature router', () => {
  it('scopes the site companion to Tea and Story without leaking it into Tarot', () => {
    expect(roomAiFeatureForAction('tea')).toBe('tea')
    expect(roomAiFeatureForAction('desk')).toBe('story')
    expect(roomAiFeatureForAction('crystal')).toBe('tarot')
    expect(roomAiFeatureForAction('wardrobe')).toBe('other')
    expect(roomFeatureHasCompanion('tea')).toBe(true)
    expect(roomFeatureHasCompanion('story')).toBe(true)
    expect(roomFeatureHasCompanion('tarot')).toBe(true)
  })

  it('uses the document mode only for the source final-save metadata call', () => {
    expect(storyModeForSourceCall({ documentSaving: false, wantMeta: true })).toBe('turn')
    expect(storyModeForSourceCall({ documentSaving: true, wantMeta: false })).toBe('turn')
    expect(storyModeForSourceCall({ documentSaving: true, wantMeta: true })).toBe('document')
  })

  it('projects only the previous generated document segment into continuation state', () => {
    expect(documentContinuationFromSourceMessages([
      { role: 'system', content: 'browser prompt' },
      { role: 'user', content: 'browser-built document prompt' },
    ])).toBe('')
    expect(documentContinuationFromSourceMessages([
      { role: 'system', content: 'browser prompt' },
      { role: 'assistant', content: '第一段' },
      { role: 'user', content: '继续' },
    ])).toBe('第一段')
  })

  it('keeps an immutable ending snapshot and preserves exact document segment boundaries', () => {
    const history = [{ role: 'user' as const, content: '第十二轮选择' }]
    const snapshot = createStoryDocumentSnapshot({
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      sourceSession: 7,
      genre: 'fantasy',
      horror: 'no',
      customScript: null,
      messages: history,
      endingContent: '{"story":"结局","choices":[],"isEnding":true,"endingType":"normal","mood":"calm"}',
      documentGrant: 'a'.repeat(64),
    })
    history[0]!.content = '新游戏篡改'

    expect(snapshot.messages[0]?.content).toBe('第十二轮选择')
    expect(snapshot.messages.at(-1)?.role).toBe('assistant')
    const next = advanceStoryDocumentSnapshot(snapshot, {
      content: '\n第一段末尾\n\n',
      truncated: true,
      documentGrant: 'b'.repeat(64),
    })
    expect(next).toMatchObject({
      documentSoFar: '\n第一段末尾\n\n',
      documentSegment: 1,
      documentGrant: 'b'.repeat(64),
      sourceSession: 7,
    })
  })
})
