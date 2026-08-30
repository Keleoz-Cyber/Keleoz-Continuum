import { z } from 'zod'

import type { AiMessage } from '@/modules/ai/provider'

export const STORY_GENRES = ['fantasy', 'mystery', 'detective', 'romance', 'scifi'] as const
export const STORY_HORROR_LEVELS = ['no', 'low', 'mid', 'high'] as const

export type StoryGenre = (typeof STORY_GENRES)[number]
export type StoryHorrorLevel = (typeof STORY_HORROR_LEVELS)[number]

const storyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4_000),
}).strict()

const sharedStoryRequestShape = {
  sessionId: z.uuid(),
  genre: z.enum(STORY_GENRES),
  horror: z.enum(STORY_HORROR_LEVELS),
  customScript: z.string().trim().min(1).max(3_000).nullable(),
  messages: z.array(storyMessageSchema).min(1).max(40),
}

export const storyGatewayRequestSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('turn'), ...sharedStoryRequestShape }).strict(),
  z.object({
    mode: z.literal('document'),
    ...sharedStoryRequestShape,
    documentSoFar: z.string().max(80_000),
    documentSegment: z.number().int().min(0).max(3),
    documentGrant: z.string().min(32).max(256).regex(/^[A-Za-z0-9._-]+$/),
  }).strict(),
]).superRefine((value, context) => {
  const totalCharacters = value.messages.reduce((total, message) => total + message.content.length, 0)
  if (totalCharacters > 40_000) {
    context.addIssue({ code: 'custom', path: ['messages'], message: 'Story history is too long' })
  }
})

export type StoryGatewayRequest = z.infer<typeof storyGatewayRequestSchema>

const genreNames: Record<StoryGenre, string> = {
  fantasy: '奇幻',
  mystery: '神秘学',
  detective: '推理悬疑',
  romance: '恋爱',
  scifi: '科幻',
}
const horrorNames: Record<StoryHorrorLevel, string> = {
  no: '无',
  low: '轻微',
  mid: '中等',
  high: '强烈',
}

export function buildStoryTurnSystemPrompt(
  input: Pick<StoryGatewayRequest, 'genre' | 'horror' | 'customScript'>,
) {
  const customScript = input.customScript
    ? `以下是玩家提供的自定义剧本，请根据剧本内容来主持游戏：\n\n「${input.customScript}」\n\n请按照剧本中的世界观、角色和剧情逻辑来推进故事。如果剧本只提供了方向性描述，请自由发挥细节。\n`
    : ''
  const genreHint = input.customScript ? '' : input.genre === 'detective'
    ? '玩家将扮演侦探角色来破案。请设计一个有悬念的案件，提供线索、嫌疑人和推理环节，让玩家通过选择来收集证据、审讯嫌疑人并最终揭开真相。\n'
    : input.genre === 'mystery'
      ? '故事围绕神秘学与宗教展开。创作题材可从以下方向选取（不限于此）：塔罗象征、炼金术、卡巴拉、赫尔墨斯主义、蔷薇十字会、诺斯替主义、基督教密契传统、佛教、密宗、苏菲派、神道教等。恐怖程度较低时以经典神秘传统为主；恐怖程度较高时可加入虚构的异端教派、架空的禁忌仪式、洛夫克拉夫特式宇宙恐怖、以及你自由创作的邪典体系——但所有黑暗或邪典内容必须是虚构的，禁止引用现实中的邪教事件或真实犯罪。请用通俗易懂的方式讲故事，玩家不需要专业知识也能玩得开心。\n'
      : ''
  const storyLimit = input.customScript ? 200 : 180

  return `请扮演互动小说/文字冒险游戏的游戏主持人来主持这个游戏。
${customScript}用户选择了${genreNames[input.genre]}类型游戏，恐怖程度为${horrorNames[input.horror]}。
${genreHint}每次给出一段剧情描述（${storyLimit}字以内），然后提供3个选项让玩家选择。
故事在第12轮（可酌情增加到12到16轮）结束时导向结局。共有3个普通结局和1个隐藏结局。
请以JSON格式回复：
{"story":"剧情文字","choices":["选项1","选项2","选项3"],"isEnding":false,"endingType":null,"mood":"calm"}
其中mood只能取以下5个值之一：calm（平静日常）、joy（开心愉悦）、tense（紧张警惕）、sad（悲伤难过）、shock（震惊意外）。请根据剧情走向与玩家上一个选项造成的后果来选择。
不要输出任何JSON以外的内容。`
}

function readableHistory(messages: StoryGatewayRequest['messages']) {
  return messages.map((message) => {
    if (message.role === 'user') return `[Player] ${message.content}`
    try {
      const parsed = JSON.parse(message.content) as Record<string, unknown>
      const story = typeof parsed.story === 'string' ? parsed.story : message.content
      const choices = Array.isArray(parsed.choices)
        ? ` | Choices: ${parsed.choices.filter((choice): choice is string => typeof choice === 'string').join(', ')}`
        : ''
      const ending = parsed.isEnding ? ` [ENDING: ${String(parsed.endingType ?? '')}]` : ''
      return `[GM] ${story}${choices}${ending}`
    } catch {
      return `[GM] ${message.content}`
    }
  }).join('\n')
}

export function buildStoryDocumentMessages(
  input: Extract<StoryGatewayRequest, { mode: 'document' }>,
): AiMessage[] {
  const documentPrompt = `Based on the following interactive story session, generate a COMPLETE game design document in Chinese. Include ALL of the following sections:

## 游戏概要
Brief overview of the story world, theme, and core concept.

## 完整剧本
The full script/narrative of what happened, written as a readable story.

## 游戏机制
- Scoring system (what gives points, point values)
- Key decision points and their consequences

## 多结局设定
List ALL possible endings (not just the one reached), including:
- Normal endings (at least 3)
- Hidden/secret ending(s)
- How each ending is triggered (conditions)

## 隐藏要素
- Secret items, easter eggs, hidden dialogue triggers
- Special combinations that unlock hidden content

## 角色与世界观
Character descriptions, world lore, key locations

Session log:
${readableHistory(input.messages)}
---
Genre: ${input.genre}, Horror level: ${input.horror}
Write the document entirely in Chinese. Be creative and comprehensive.`
  const messages: AiMessage[] = [
    {
      role: 'system',
      content: '你是一个专业的游戏设计师，擅长将互动故事会话整理为完整的游戏设计文档。输出纯文本，不使用markdown代码块。',
    },
    { role: 'user', content: documentPrompt },
  ]
  if (input.documentSoFar) {
    messages.push(
      { role: 'assistant', content: input.documentSoFar },
      { role: 'user', content: '继续。直接从中断处接着输出剩余内容，不要重复已输出的部分，也不要加任何说明。' },
    )
  }
  return messages
}
