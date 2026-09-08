'use client'

import { useEffect, useState } from 'react'
import { SourcePublicNav } from '@/modules/home/source-public-nav'
import { readGuestHistory } from './browser'
import { exportGuestHistory, type GuestHistory } from './contracts'

const labels = {'tea-history':'Tea · 茶歇','story-history':'Story · 故事','tarot-history':'Tarot · 占卜'}
function download(text:string,name:string,type:string){
  const url=URL.createObjectURL(new Blob([text],{type})),anchor=document.createElement('a')
  anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function HistoryClient(){
  const [records,setRecords]=useState<GuestHistory[]>([]),[selected,setSelected]=useState<string|null>(null)
  const [filter,setFilter]=useState('all'),[search,setSearch]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[skipped,setSkipped]=useState(0)
  async function refresh(){
    setLoading(true);setError('')
    try{const data=await readGuestHistory();setRecords(data.records);setSkipped(data.skipped)}catch(e){setError(e instanceof Error?e.message:'无法读取本机存档。')}finally{setLoading(false)}
  }
  useEffect(()=>{
    let active=true
    readGuestHistory().then(data=>{if(active){setRecords(data.records);setSkipped(data.skipped)}},e=>{if(active)setError(e instanceof Error?e.message:'无法读取本机存档。')}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[])
  const current=records.find(r=>r.id===selected)
  const query=search.trim().toLowerCase()
  const filtered=records.filter(r=>(filter==='all'||r.type===filter)&&(!query||`${r.title}\n${r.subtitle}\n${r.content}`.toLowerCase().includes(query)))
  return <main className="source-public-page source-blog-page source-history-page">
    <div className="source-public-bg" aria-hidden="true"/><SourcePublicNav current="history"/>
    <section className="source-page active">
      <div className="module-intro"><div className="module-intro-top"><h1>本机存档</h1><span className="module-intro-sub">Local history</span></div><div className="module-intro-rule"/><div className="module-intro-desc">Tea、Story 与 Tarot 的私人记录。只读取当前浏览器，不上传服务器。<br/>清理浏览器数据可能丢失记录，请及时导出。故事进度以文字记录保存，不代表可以恢复游戏回合。</div></div>
      <div className="blog-actions"><button className="btn" onClick={()=>void refresh()} disabled={loading}>重新读取</button><button className="btn" disabled={loading||!!error||!records.length} onClick={()=>download(exportGuestHistory(records),'keleoz-local-history.json','application/json;charset=utf-8')}>导出全部存档</button></div>
      {error?<p role="alert">{error} 原数据未修改，请重试。</p>:null}
      {skipped?<p role="status">有 {skipped} 条存档格式无法识别，原数据未修改。</p>:null}
      {current?<article className="post-view source-history-reader">
        <div className="blog-actions"><button className="btn" onClick={()=>setSelected(null)}>← 返回列表</button><button className="btn" onClick={()=>download(`${current.title}\n${current.subtitle}\n\n${current.content}`,`${current.id.replace(':','-')}.txt`,'text/plain;charset=utf-8')}>导出这条记录</button></div>
        <h2 className="post-view-title">{current.title}</h2><p className="post-view-sub">{current.subtitle}</p><p className="post-view-meta">{labels[current.type]} · {new Date(current.updatedAt).toLocaleString('zh-CN')}</p>
        <div className="post-view-content source-history-content">{current.content}</div>
      </article>:<div className="blog-layout"><aside className="blog-side"><div className="blog-stats">{records.length} 条本机存档</div><div className="blog-side-rule"/><div className="category-bar" aria-label="存档类型">
        <button className={`cat-tag${filter==='all'?' active':''}`} onClick={()=>setFilter('all')}>All</button>{Object.entries(labels).map(([key,label])=><button key={key} className={`cat-tag${filter===key?' active':''}`} onClick={()=>setFilter(key)}>{label}</button>)}
      </div></aside><div className="blog-main"><input className="blog-search" aria-label="搜索本机存档" type="search" placeholder="搜索标题或记录内容…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div aria-live="polite">{loading?<p>正在读取本机存档…</p>:error?null:filtered.length?filtered.map(r=><button key={r.id} className="post-card glass-card source-history-card" onClick={()=>setSelected(r.id)}><div className="post-card-title">{r.title}</div><div className="post-card-sub">{r.subtitle}</div><div className="post-card-preview">{r.content.slice(0,160)}</div><div className="post-card-meta"><span>{labels[r.type]}</span><time>{new Date(r.updatedAt).toLocaleDateString('zh-CN')}</time></div></button>):<div className="empty-state">{records.length?'没有符合条件的记录。':'本浏览器还没有存档。在 Tea、Story 或 Tarot 中点击 Save 后，可在这里查看。'}</div>}</div>
      </div></div>}
    </section>
  </main>
}
