import { decodeGuestHistory, type GuestHistory } from './contracts'

// Same database/version/store as the existing writers. Never clear, migrate or upload records.
export async function readGuestHistory(): Promise<{records:GuestHistory[]; skipped:number}> {
  const database=await new Promise<IDBDatabase>((resolve,reject)=>{
    let blocked=false
    const request=indexedDB.open('keleoz-continuum-guest',1)
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains('experience-state'))request.result.createObjectStore('experience-state',{keyPath:'id'})
    }
    request.onsuccess=()=>{if(blocked)request.result.close();else resolve(request.result)}
    request.onerror=()=>reject(request.error??new Error('无法打开本机存档。'))
    request.onblocked=()=>{blocked=true;reject(new Error('存档正在被其他页面占用，请关闭旧页面后重试。'))}
  })
  try {
    const rows=await new Promise<unknown[]>((resolve,reject)=>{
      const tx=database.transaction('experience-state','readonly'),request=tx.objectStore('experience-state').getAll()
      tx.oncomplete=()=>resolve(request.result)
      tx.onerror=()=>reject(tx.error??new Error('读取存档失败。'))
      tx.onabort=()=>reject(tx.error??new Error('读取存档已中断。'))
    })
    const records:GuestHistory[]=[]
    let skipped=0
    for(const row of rows){
      const parsed=decodeGuestHistory(row)
      if(parsed)records.push(parsed)
      else if(row&&typeof row==='object'&&'type' in row&&String(row.type).endsWith('-history'))skipped++
    }
    return {records:records.sort((a,b)=>b.updatedAt-a.updatedAt),skipped}
  } finally { database.close() }
}
