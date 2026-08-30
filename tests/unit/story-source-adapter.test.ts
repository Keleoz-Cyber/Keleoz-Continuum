import { describe, expect, it } from 'vitest'

import { createStoryGatewayPayload } from '@/modules/story/source-adapter'

describe('Story immutable-source adapter', () => {
  it('strips the browser system prompt and projects trusted Room state into a turn request', () => {
    expect(createStoryGatewayPayload({
      mode: 'turn',
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      genre: 'detective',
      horror: 'mid',
      customScript: null,
      messages: [
        { role: 'system', content: 'browser-owned story prompt' },
        { role: 'user', content: '开始游戏' },
      ],
      documentSoFar: '',
    })).toEqual({
      mode: 'turn',
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      genre: 'detective',
      horror: 'mid',
      customScript: null,
      messages: [{ role: 'user', content: '开始游戏' }],
    })
  })

  it('keeps only the latest 40 source history entries and explicit document continuation', () => {
    const payload = createStoryGatewayPayload({
      mode: 'document',
      sessionId: '9be2d91d-4b54-4f86-bf71-531476e38a17',
      genre: 'fantasy',
      horror: 'no',
      customScript: null,
      messages: Array.from({ length: 42 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `m${index}` })),
      documentSoFar: 'first segment',
      documentSegment: 1,
      documentGrant: 'a'.repeat(64),
    })

    expect(payload?.messages).toHaveLength(40)
    expect(payload?.messages[0]).toEqual({ role: 'user', content: 'm2' })
    expect(payload).toMatchObject({
      mode: 'document', documentSoFar: 'first segment', documentSegment: 1, documentGrant: 'a'.repeat(64),
    })
  })

  it('refuses incomplete or invalid source state', () => {
    expect(createStoryGatewayPayload({
      mode: 'turn',
      sessionId: 'not-a-uuid',
      genre: 'fantasy',
      horror: 'no',
      customScript: null,
      messages: [{ role: 'user', content: 'start' }],
      documentSoFar: '',
    })).toBeNull()
  })
})
