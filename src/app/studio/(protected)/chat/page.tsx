import Link from 'next/link'

import { OwnerChatClient } from '@/modules/owner-chat/chat-client'
import { ownerChatAiEnabled } from '@/modules/owner-chat/runtime'
import { createCompanionAction, createThreadAction, updateCompanionAction } from '@/modules/owner-memory/actions'
import { ownerKnowledgeRepository } from '@/modules/owner-memory/runtime'

export default async function OwnerChatPage({ searchParams }: { searchParams: Promise<{ thread?: string; companion?: string; q?: string }> }) {
  const params = await searchParams
  const query = params.q?.trim().toLocaleLowerCase().slice(0, 160) ?? ''
  const [companions, threads] = await Promise.all([
    ownerKnowledgeRepository.listCompanions(), ownerKnowledgeRepository.listThreads(),
  ])
  const selectedId = params.thread && threads.some((thread) => thread.id === params.thread) ? params.thread : threads[0]?.id
  const selected = selectedId ? await ownerKnowledgeRepository.getThread(selectedId) : null
  const selectedCompanion = companions.find((item) => item.id === (params.companion ?? selected?.companion.id)) ?? companions[0]

  return <main className="source-studio-page source-chat-page">
    <section className="source-module-intro">
      <div><h1>Chat</h1><span>Private AI dialogue</span></div>
      <i />
      <p>Owner 私人对话。话题、Memory 与 Auto Memory 保存在 PostgreSQL；API Key 只留在服务器。</p>
    </section>
    <section className="source-chat-shell">
      <header className="source-chat-toolbar">
        <form className="source-chat-search">
          {selected ? <input type="hidden" name="thread" value={selected.id} /> : null}
          <input aria-label="Search current conversation" name="q" defaultValue={params.q} maxLength={160} placeholder="搜索当前对话…" />
        </form>
        <div><Link href="/studio/memory">Memory</Link><span>{ownerChatAiEnabled ? 'AI ready' : 'AI gateway disabled'}</span></div>
      </header>
      <div className="source-chat-body">
        <aside className="source-chat-sidebar">
          <h2>同行者</h2>
          {companions.map((companion) => <details key={companion.id} open={selectedCompanion?.id === companion.id}>
            <summary>{companion.name}</summary>
            <form action={updateCompanionAction} className="source-compact-form">
              <input type="hidden" name="id" value={companion.id} />
              <input name="name" defaultValue={companion.name} aria-label="Companion name" required />
              <textarea name="description" defaultValue={companion.description} aria-label="Companion description" rows={2} />
              <textarea name="systemPrompt" defaultValue={companion.systemPrompt} aria-label="Companion system prompt" rows={4} required />
              <label><input type="checkbox" name="memoryEnabled" defaultChecked={companion.memoryEnabled} />Memory</label>
              <label><input type="checkbox" name="autoMemoryEnabled" defaultChecked={companion.autoMemoryEnabled} />Auto Memory</label>
              <button>保存同行者</button>
            </form>
            <form action={createThreadAction} className="source-new-thread">
              <input type="hidden" name="companionId" value={companion.id} />
              <input name="title" placeholder="新话题标题" maxLength={160} />
              <button>＋ 话题</button>
            </form>
          </details>)}
          <details className="source-new-companion" open={!companions.length}>
            <summary>＋ 新同行者</summary>
            <form action={createCompanionAction} className="source-compact-form">
              <input name="name" placeholder="名字" required maxLength={120} />
              <textarea name="description" placeholder="身份简介" rows={2} />
              <textarea name="systemPrompt" placeholder="角色边界与语气" rows={4} required />
              <label><input type="checkbox" name="memoryEnabled" defaultChecked />Memory</label>
              <label><input type="checkbox" name="autoMemoryEnabled" defaultChecked />Auto Memory</label>
              <button>创建同行者</button>
            </form>
          </details>
          <h2>话题频道</h2>
          <nav>{threads.map((thread) => <Link className={thread.id === selectedId ? 'active' : ''} href={`/studio/chat?thread=${thread.id}`} key={thread.id}>{thread.title}</Link>)}</nav>
        </aside>
        <OwnerChatClient aiEnabled={ownerChatAiEnabled} thread={selected ? {
          id: selected.id, archived: selected.archived, companionName: selected.companion.name,
          messages: selected.messages.filter((message) => !query || message.content.toLocaleLowerCase().includes(query)).map((message) => ({ id: message.id, role: message.role, content: message.content, createdAt: message.createdAt, autoMemoryEvents: message.autoMemoryEvents })),
        } : null} />
      </div>
    </section>
  </main>
}
