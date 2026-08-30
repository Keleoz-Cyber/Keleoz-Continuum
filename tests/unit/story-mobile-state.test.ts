import { describe, expect, it } from 'vitest'

import {
  applyMobileStoryReply,
  chooseMobileStoryOption,
  createMobileStoryState,
  mobileStoryRoundLimit,
  parseSourceStoryReply,
  startMobileStory,
} from '@/modules/story/mobile-state'

const reply = JSON.stringify({
  story: '雨停在午夜十二点，钟楼的门缓缓打开。',
  choices: ['进入钟楼', '检查门锁', '沿街离开'],
  isEnding: false,
  endingType: null,
  mood: 'shock',
})

describe('Mobile Story state', () => {
  it('starts and advances the source round contract exactly once per visitor choice', () => {
    const setup = createMobileStoryState('9be2d91d-4b54-4f86-bf71-531476e38a17', 'detective', 'mid')
    const started = startMobileStory(setup)
    const answered = applyMobileStoryReply(started, reply, null)
    const chosen = chooseMobileStoryOption(answered, '进入钟楼', 16)

    expect(started).toMatchObject({ step: 'playing', round: 1, messages: [{ role: 'user', content: '开始游戏' }] })
    expect(answered).toMatchObject({ current: { mood: 'shock', choices: ['进入钟楼', '检查门锁', '沿街离开'] } })
    expect(chosen).toMatchObject({ round: 2, current: null })
    expect(chosen.messages.at(-1)).toEqual({ role: 'user', content: '进入钟楼' })
  })

  it('parses the source JSON block and preserves its fallback behavior', () => {
    expect(parseSourceStoryReply(`主持人：${reply}\n请继续`)).toMatchObject({
      story: '雨停在午夜十二点，钟楼的门缓缓打开。',
      choices: ['进入钟楼', '检查门锁', '沿街离开'],
      mood: 'shock',
    })
    expect(parseSourceStoryReply('连接恢复后，故事继续。')).toEqual({
      story: '连接恢复后，故事继续。',
      choices: ['继续', '返回'],
      isEnding: false,
      endingType: null,
      mood: 'calm',
    })
  })

  it('enters the ending state and keeps the server document grant out of transcript messages', () => {
    const started = startMobileStory(createMobileStoryState(
      '9be2d91d-4b54-4f86-bf71-531476e38a17', 'fantasy', 'no',
    ))
    const ending = applyMobileStoryReply(started, JSON.stringify({
      story: '你敲响最后一声钟。', choices: [], isEnding: true, endingType: 'normal', mood: 'joy',
    }), 'grant-token')

    expect(ending).toMatchObject({ step: 'ending', documentGrant: 'grant-token', current: { isEnding: true } })
    expect(JSON.stringify(ending.messages)).not.toContain('grant-token')
  })

  it('does not mutate state when retrying or choosing beyond the bounded source rounds', () => {
    const state = applyMobileStoryReply(
      { ...startMobileStory(createMobileStoryState('9be2d91d-4b54-4f86-bf71-531476e38a17', 'scifi', 'low')), round: 16 },
      reply,
      null,
    )
    expect(chooseMobileStoryOption(state, '进入钟楼', 16)).toBe(state)
  })

  it('reserves up to four document requests while never exceeding the source 16-round ceiling', () => {
    expect(mobileStoryRoundLimit(20)).toBe(16)
    expect(mobileStoryRoundLimit(16)).toBe(12)
    expect(mobileStoryRoundLimit(4)).toBe(0)
    expect(mobileStoryRoundLimit(64)).toBe(16)
  })
})
