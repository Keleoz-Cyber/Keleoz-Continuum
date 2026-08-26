import Link from 'next/link'

import { createBlogDraftAction } from '@/modules/content/actions'
import { contentRepository } from '@/modules/content/runtime'
import { reviewLetterAction } from '@/modules/letters/owner-actions'
import { lettersRepository } from '@/modules/letters/runtime'

export default async function StudioOverviewPage() {
  const drafts = await contentRepository.listStudioDrafts()
  const letters = await lettersRepository.listForOwner()
  const pendingLetters = letters.filter((letter) => letter.status === 'pending')

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
      <section className="studio-inbox" aria-labelledby="letters-inbox-title">
        <div className="studio-inbox-heading">
          <div>
            <p className="studio-kicker">Inbox · 信箱</p>
            <h2 id="letters-inbox-title">Letters awaiting review</h2>
          </div>
          <strong>{pendingLetters.length}</strong>
        </div>
        {letters.length === 0 ? <p className="studio-muted">还没有访客来信。</p> : (
          <div className="studio-letter-list">
            {letters.slice(0, 6).map((letter) => (
              <article className="studio-letter-item" key={letter.id}>
                <div className="studio-letter-copy">
                  <div><strong>{letter.senderName || 'Anonymous'}</strong><span>{letter.postalCode}</span><small>{letter.status}</small></div>
                  <p>{letter.content}</p>
                </div>
                {letter.status === 'pending' ? (
                  <form action={reviewLetterAction} className="studio-letter-review">
                    <input type="hidden" name="id" value={letter.id} />
                    <textarea name="ownerReply" rows={2} maxLength={10_000} placeholder="可选：给这封信留一句回信" />
                    <div><button type="submit" name="status" value="approved">Approve</button><button type="submit" name="status" value="rejected">Reject</button></div>
                  </form>
                ) : letter.ownerReply ? <p className="studio-letter-reply">Reply: {letter.ownerReply}</p> : null}
              </article>
            ))}
          </div>
        )}
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
