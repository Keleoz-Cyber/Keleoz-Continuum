export function nativeThinkingMessages<T extends {role:string;content:unknown}>(messages:T[]):T[]{
  const prefixes=[
    ['[回复格式] 每次回复请先输出一段 <thinking> 标签包裹的思路笔记','</thinking>\n\n正式回复\n\n'],
    ['【重要格式要求】你必须在每次回复时，先输出 <thinking>','不可省略 <thinking> 标签，这是强制格式要求。\n\n'],
  ]
  return messages.map(message=>{
    if(message.role!=='system'||typeof message.content!=='string')return message
    for(const [start,end] of prefixes){if(message.content.startsWith(start)){const index=message.content.indexOf(end);if(index>=0)return {...message,content:message.content.slice(index+end.length)}}}
    return message
  })
}
