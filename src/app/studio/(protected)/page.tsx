import Link from 'next/link'

import { createBlogDraftAction } from '@/modules/content/actions'
import { contentRepository } from '@/modules/content/runtime'

export default async function StudioOverviewPage() {
  const drafts = await contentRepository.listStudioDrafts()

  return (
    <main className="studio-main">
      <header className="studio-title-block">
        <p className="eyebrow">Create · 创作</p>
        <h1>Studio</h1>
        <p>草稿与发布工具将在这里保持克制地展开。</p>
      </header>
      <section className="studio-overview" aria-labelledby="drafts-title">
        <div>
          <p className="studio-kicker">Current</p>
          <h2 id="drafts-title">Blog drafts</h2>
        </div>
        <strong>{drafts.length}</strong>
      </section>
      <form action={createBlogDraftAction} className="studio-create-form">
        <label>
          <span>New Blog title</span>
          <input name="title" required maxLength={240} />
        </label>
        <button type="submit">Create draft</button>
      </form>
      <div className="studio-draft-list">
        {drafts.map((draft) => (
          <Link href={`/studio/blog/${draft.id}`} key={draft.id}>
            <span>{draft.title}</span>
            <small>Revision {draft.revision}</small>
          </Link>
        ))}
      </div>
    </main>
  )
}
