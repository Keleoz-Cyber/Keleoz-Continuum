import { describe, expect, it } from 'vitest'

import {
  assertPersonaCanPropose,
  parsePersonaAiProposal,
  personaReviewProposalSchema,
  type PersonaPermissions,
} from '@/modules/persona/contracts'

const allPermissions: PersonaPermissions = {
  enabled: true,
  canPost: true,
  canComment: true,
  canRepost: true,
  canUseImages: true,
}

describe('AI Persona review contracts', () => {
  it('accepts a bounded post proposal without a public-write instruction', () => {
    const proposal = personaReviewProposalSchema.parse({
      action: 'post',
      content: '雾散了一点，窗边留下今天的蓝。',
      imagePrompt: null,
    })

    expect(proposal).toEqual({
      action: 'post',
      content: '雾散了一点，窗边留下今天的蓝。',
      imagePrompt: null,
      targetEntryId: null,
      targetCommentId: null,
    })
  })

  it('requires a target for comments, replies, and reposts', () => {
    for (const action of ['comment', 'reply', 'repost'] as const) {
      expect(() => personaReviewProposalSchema.parse({ action, content: '回应。' })).toThrow()
    }
    expect(() => personaReviewProposalSchema.parse({
      action: 'reply',
      content: '回应。',
      targetEntryId: crypto.randomUUID(),
    })).toThrow()
  })

  it('enforces each Persona permission and keeps image permission independent', () => {
    const post = personaReviewProposalSchema.parse({ action: 'post', content: '一条动态。' })
    expect(() => assertPersonaCanPropose({ ...allPermissions, canPost: false }, post)).toThrow('post')

    const comment = personaReviewProposalSchema.parse({
      action: 'comment', content: '一条评论。', targetEntryId: crypto.randomUUID(),
    })
    expect(() => assertPersonaCanPropose({ ...allPermissions, canComment: false }, comment)).toThrow('comment')

    const repost = personaReviewProposalSchema.parse({
      action: 'repost', content: '转发感想。', targetEntryId: crypto.randomUUID(), imagePrompt: '雨夜窗面',
    })
    expect(() => assertPersonaCanPropose({ ...allPermissions, canRepost: false }, repost)).toThrow('repost')
    expect(() => assertPersonaCanPropose({ ...allPermissions, canUseImages: false }, repost)).toThrow('image')
  })

  it('rejects disabled Personas before checking action permissions', () => {
    const proposal = personaReviewProposalSchema.parse({ action: 'post', content: '一条动态。' })
    expect(() => assertPersonaCanPropose({ ...allPermissions, enabled: false }, proposal)).toThrow('disabled')
  })

  it('parses only the strict JSON proposal returned by the model', () => {
    expect(parsePersonaAiProposal('{"content":"  一条待审核动态。  ","imagePrompt":null}', {
      action: 'post', targetEntryId: null, targetCommentId: null,
    })).toEqual({
      action: 'post',
      content: '一条待审核动态。',
      imagePrompt: null,
      targetEntryId: null,
      targetCommentId: null,
    })

    expect(() => parsePersonaAiProposal('<ws_post>绕过审核</ws_post>', {
      action: 'post', targetEntryId: null, targetCommentId: null,
    })).toThrow('JSON')
  })
})
