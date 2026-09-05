import { expect,it } from 'vitest'
import { nativeThinkingMessages } from '@/modules/ai/native-thinking'
it('removes only the original synthetic thinking preamble, not the actual system instructions',()=>{
  const messages=[{role:'system',content:'[回复格式] 每次回复请先输出一段 <thinking> 标签包裹的思路笔记，然后正式回复。\n<thinking>\n草稿\n</thinking>\n\n正式回复\n\n真正的角色与记忆指令。'}]
  expect(nativeThinkingMessages(messages)[0].content).toBe('真正的角色与记忆指令。')
})
it('preserves user text and unrelated custom instructions',()=>{
  const messages=[{role:'user',content:'解释 <thinking> 标签'},{role:'system',content:'请讨论思考过程。'}]
  expect(nativeThinkingMessages(messages)).toEqual(messages)
})
