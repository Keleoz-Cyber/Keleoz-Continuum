import type { DraftSnapshot } from '@/modules/content/schemas'
export type SaveState='idle'|'dirty'|'saving'|'saved'|'conflict'|'error'
export class DraftSaveQueue {
  private saved:string
  private pending:Promise<void>|null=null
  constructor(public snapshot:DraftSnapshot,public revision:number,public send:(snapshot:DraftSnapshot,revision:number)=>Promise<number>,public notify:(state:SaveState,revision:number)=>void){this.saved=JSON.stringify(snapshot)}
  update(snapshot:DraftSnapshot){this.snapshot=snapshot;if(this.dirty())this.notify('dirty',this.revision)}
  dirty(){return JSON.stringify(this.snapshot)!==this.saved}
  flush():Promise<void>{
    if(this.pending)return this.pending
    this.pending=(async()=>{
      try{
        while(this.dirty()){
          const snapshot=this.snapshot,payload=JSON.stringify(snapshot)
          this.notify('saving',this.revision)
          this.revision=await this.send(snapshot,this.revision)
          this.saved=payload
        }
        this.notify('saved',this.revision)
      }catch(error){this.notify(error instanceof Error&&error.message==='draft_conflict'?'conflict':'error',this.revision);throw error}
    })().finally(()=>{this.pending=null})
    return this.pending
  }
}
