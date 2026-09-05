import { createHash } from 'node:crypto'
export function ownerDailyAiSession(ownerId:string,now:Date){
  const digest=createHash('sha256').update(`${ownerId}:${now.toISOString().slice(0,10)}`).digest('hex')
  return `${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`
}
