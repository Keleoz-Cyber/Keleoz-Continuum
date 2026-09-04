import Link from 'next/link'

import { calculateMemoryScore } from '@/modules/owner-memory/contracts'
import {
  createMemoryAction,
  deleteAutoMemoryAction,
  deleteMemoryAction,
  updateAutoMemoryAction,
  updateMemoryAction,
} from '@/modules/owner-memory/actions'
import { MemoryConstellation } from '@/modules/owner-memory/memory-constellation'
import { ownerKnowledgeRepository } from '@/modules/owner-memory/runtime'

const domains = ['情感', '日常', '创作', '思考']

export default async function OwnerMemoryPage({ searchParams }: { searchParams: Promise<{ q?: string; domain?: string; status?: string; companion?: string; archive?: string }> }) {
  const params = await searchParams
  const [allMemories, companions] = await Promise.all([
    ownerKnowledgeRepository.listMemories({ now: new Date() }), ownerKnowledgeRepository.listCompanions(),
  ])
  const query = params.q?.trim().toLowerCase() ?? ''
  const filtered = allMemories.filter((memory) => {
    if (params.domain && params.domain !== 'all' && memory.domain !== params.domain) return false
    if (params.status === 'pinned' && !memory.pinned) return false
    if (params.status === 'resolved' && !memory.resolved) return false
    if (params.status === 'unresolved' && memory.resolved) return false
    if (params.companion && params.companion !== 'all') {
      if (memory.visibility === 'private') return false
      if (memory.visibility === 'only' && !memory.visibleTo.includes(params.companion)) return false
      if (memory.visibility === 'except' && memory.excludeFrom.includes(params.companion)) return false
    }
    return !query || `${memory.title} ${memory.summary} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase().includes(query)
  })
  const selectedCompanion = companions.find((item) => item.id === params.companion) ?? companions[0]
  const autoMemories = selectedCompanion
    ? await ownerKnowledgeRepository.listAutoMemories(selectedCompanion.id, params.archive === '1')
    : []
  const injectionCharacters = allMemories.filter((memory) => memory.visibility !== 'private').slice(0, 10)
    .reduce((total, memory) => total + Math.min(200, memory.content.length) + memory.title.length, 0)
  const domainCounts = domains.map((domain) => ({ domain, count: allMemories.filter((memory) => memory.domain === domain).length }))

  return <main className="source-studio-page source-memory-page">
    <section className="source-module-intro">
      <div><h1>Memory</h1><span>Long-term emotional memory</span></div><i />
      <p>记忆库。一个有温度、会衰减、会浮现的长期记忆系统。<br />管理你和同行者之间的共同记忆，让每一次对话都能延续过去的故事。</p>
    </section>
    <section className="source-memory-sky">
      <MemoryConstellation memories={allMemories} />
      <span className="axis top">炽烈<small>Arousal</small></span><span className="axis bottom">平静</span>
      <span className="axis left">消极</span><span className="axis right">积极<small>Valence</small></span>
    </section>
    <p className="source-memory-legend">每一个记忆都会化为星图上的一颗恒星。　<span>● 大小 = 重要性</span>　<span>● 明暗 = 活跃度</span>　<span>● 金色 = 置顶记忆</span></p>
    <section className="source-memory-deck">
      <div><strong>{allMemories.length}</strong><span>总计</span></div><div><strong>{allMemories.filter((memory) => memory.pinned).length}</strong><span>置顶</span></div><div><strong>{allMemories.filter((memory) => !memory.resolved).length}</strong><span>未解决</span></div><div><strong>{allMemories.filter((memory) => memory.resolved).length}</strong><span>已解决</span></div>
      <div className="source-memory-budget"><p>每次注入约 <b>{injectionCharacters}</b> 字符（≈ {Math.ceil(injectionCharacters / 4)} token）</p><i><span style={{ width: `${Math.min(100, injectionCharacters / 20)}%` }} /></i><small>每次注入上限约 2000 字符</small></div>
    </section>
    <section className="source-memory-domains"><p>领域分布（颜色对应星点）</p><div>{domainCounts.map((item) => <span style={{ flex: Math.max(1, item.count) }} key={item.domain}>{item.domain} · {item.count}</span>)}</div></section>
    <blockquote className="source-memory-quote">They say time devours all things, but say nothing about what becomes of the things as time digests them.</blockquote>

    <section className="source-auto-memory">
      <div className="source-auto-orb"><i /><span>Auto Memory</span></div>
      <div className="source-auto-tray">
        <header><div><small>Auto Memory</small><h2>{selectedCompanion?.name ?? '尚未配置同行者'}</h2></div>{selectedCompanion ? <Link href={`/studio/memory?companion=${selectedCompanion.id}&archive=${params.archive === '1' ? '0' : '1'}`}>{params.archive === '1' ? 'Active' : 'Archived'}</Link> : null}</header>
        {companions.length > 1 ? <nav>{companions.map((companion) => <Link href={`/studio/memory?companion=${companion.id}`} key={companion.id}>{companion.name}</Link>)}</nav> : null}
        {autoMemories.length ? autoMemories.map((entry) => <form action={updateAutoMemoryAction} className="source-auto-entry" key={entry.id}>
          <input type="hidden" name="id" value={entry.id} /><input type="hidden" name="companionId" value={entry.companionId} />
          <span>{entry.category}</span><select name="priority" defaultValue={entry.priority}><option value="always">always</option><option value="normal">normal</option><option value="low">low</option></select>
          <textarea name="content" defaultValue={entry.content} maxLength={600} required />
          <label><input type="checkbox" name="archived" defaultChecked={entry.archived} />Archived</label><button>保存</button>
          <button formAction={deleteAutoMemoryAction}>删除</button>
        </form>) : <p>{selectedCompanion ? '还没有 Auto Memory 条目。它会在对话中按需生成。' : '先在 Chat 创建一位同行者。'}</p>}
      </div>
    </section>

    <section className="source-memory-index">
      <header><div><h2>Memories</h2><span>The constellation index</span></div><details><summary>＋ 新记忆</summary><form action={createMemoryAction}><MemoryForm companions={companions} /></form></details></header>
      <form className="source-memory-filters"><input name="q" defaultValue={params.q} placeholder="搜索记忆…" /><select name="domain" defaultValue={params.domain ?? 'all'}><option value="all">全部领域</option>{domains.map((domain) => <option key={domain}>{domain}</option>)}</select><select name="status" defaultValue={params.status ?? 'all'}><option value="all">全部状态</option><option value="pinned">置顶</option><option value="unresolved">未解决</option><option value="resolved">已解决</option></select><select name="companion" defaultValue={params.companion ?? 'all'}><option value="all">全部 AI 可见</option>{companions.map((companion) => <option value={companion.id} key={companion.id}>{companion.name}</option>)}</select><button>筛选</button></form>
      <div className="source-memory-list">{filtered.length ? filtered.map((memory) => <details className={`source-memory-card ${memory.pinned ? 'pinned' : ''}`} key={memory.id}>
        <summary><div><h3>{memory.title}</h3><strong>{memory.pinned ? '★' : calculateMemoryScore(memory, new Date())}</strong></div>{memory.summary ? <p>{memory.summary}</p> : null}{memory.oneLine ? <blockquote>“{memory.oneLine}”</blockquote> : null}<small>{memory.createdByName ? `${memory.createdByName} 编写` : 'Owner 创建'} · {memory.createdAt.toLocaleDateString('zh-CN')}</small></summary>
        <form action={updateMemoryAction}><input type="hidden" name="id" value={memory.id} /><MemoryForm companions={companions} memory={memory} /><div className="source-memory-actions"><button>保存修改</button><button formAction={deleteMemoryAction}>删除</button></div></form>
      </details>) : <p className="source-memory-empty">◇　还没有记忆…点击「＋ 新记忆」开始记录</p>}</div>
    </section>
  </main>
}

function MemoryForm({ companions, memory }: { companions: Awaited<ReturnType<typeof ownerKnowledgeRepository.listCompanions>>; memory?: Awaited<ReturnType<typeof ownerKnowledgeRepository.getMemory>> }) {
  return <div className="source-memory-form">
    <label>标题<input name="title" defaultValue={memory?.title} required maxLength={240} /></label><label>概括<textarea name="summary" defaultValue={memory?.summary} rows={2} /></label><label>内容<textarea name="content" defaultValue={memory?.content} rows={4} required /></label><label>一句话<input name="oneLine" defaultValue={memory?.oneLine} maxLength={500} /></label>
    <div><label>领域<select name="domain" defaultValue={memory?.domain ?? '日常'}>{domains.map((domain) => <option key={domain}>{domain}</option>)}</select></label><label>标签<input name="tags" defaultValue={memory?.tags.join(', ')} /></label></div>
    <div><label>效价<input type="range" name="valence" min="0" max="1" step="0.01" defaultValue={memory?.valence ?? 0.5} /></label><label>唤醒度<input type="range" name="arousal" min="0" max="1" step="0.05" defaultValue={memory?.arousal ?? 0.3} /></label><label>重要性<input type="range" name="importance" min="1" max="10" step="1" defaultValue={memory?.importance ?? 5} /></label></div>
    <div><label>可见性<select name="visibility" defaultValue={memory?.visibility ?? 'public'}><option value="public">全部可见</option><option value="only">仅指定 AI</option><option value="except">排除指定 AI</option><option value="private">完全私密</option></select></label><label><input type="checkbox" name="pinned" defaultChecked={memory?.pinned} />置顶</label><label><input type="checkbox" name="resolved" defaultChecked={memory?.resolved} />已解决</label></div>
    {companions.length ? <><fieldset><legend>仅指定同行者</legend>{companions.map((companion) => <label key={companion.id}><input type="checkbox" name="visibleTo" value={companion.id} defaultChecked={memory?.visibleTo.includes(companion.id)} />{companion.name}</label>)}</fieldset><fieldset><legend>排除同行者</legend>{companions.map((companion) => <label key={companion.id}><input type="checkbox" name="excludeFrom" value={companion.id} defaultChecked={memory?.excludeFrom.includes(companion.id)} />{companion.name}</label>)}</fieldset></> : null}
    {!memory ? <button type="submit">保存记忆</button> : null}
  </div>
}
