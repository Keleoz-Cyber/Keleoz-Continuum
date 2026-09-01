/* eslint-disable @next/next/no-img-element -- Media Library renders pre-generated local/LightCOS variants directly. */
import Link from 'next/link'

import { createContentDraftAction } from '@/modules/content/actions'
import { CONTENT_TYPE_CONFIG, studioContentPath } from '@/modules/content/routing'
import { contentRepository } from '@/modules/content/runtime'
import { reviewLetterAction } from '@/modules/letters/owner-actions'
import { lettersRepository } from '@/modules/letters/runtime'
import { MediaUploadForm } from '@/modules/media/media-upload-form'
import { mediaService } from '@/modules/media/runtime'
import {
  createPersonaAction,
  deleteApprovedPersonaPublicationAction,
  generatePersonaReviewAction,
  moderatePersonaReviewAction,
  updatePersonaAction,
} from '@/modules/persona/actions'
import { personaAiEnabled, personaRepository } from '@/modules/persona/runtime'

const personaNotices: Record<string, string> = {
  created: 'Persona 已创建。', updated: 'Persona 权限已更新。', queued: 'AI 提案已进入审核箱。',
  approved: '提案已批准并更新公开 Moments。', rejected: '提案已退回。', deleted: '提案已从待审队列删除。',
  'ai-disabled': 'AI 网关当前关闭；Persona 配置和已有审核项仍可管理。',
  'generation-failed': 'AI 生成失败，未产生公开内容。', 'target-missing': '目标动态或评论已不存在。',
  'publication-deleted': '已删除这条 Persona 公开内容，媒体库原件保持不变。',
}

export default async function StudioOverviewPage({ searchParams }: { searchParams: Promise<{ persona?: string }> }) {
  const [{ persona: personaNotice }, drafts, letters, media, personas, reviews, moments] = await Promise.all([
    searchParams,
    contentRepository.listStudioDrafts(),
    lettersRepository.listForOwner(),
    mediaService.listReady(),
    personaRepository.listPersonas(),
    personaRepository.listReviews(),
    personaRepository.listPublicMoments(),
  ])
  const pendingLetters = letters.filter((letter) => letter.status === 'pending')
  const pendingReviews = reviews.filter((review) => review.status === 'pending')
  const replyTargets = moments.flatMap((moment) => moment.comments.map((comment) => ({
    value: `${moment.entryId}:${comment.id}`,
    label: `${comment.author.name} / ${moment.summary.slice(0, 34)} · ${comment.content.slice(0, 34)}`,
  })))

  return (
    <main className="studio-main">
      <header className="studio-title-block">
        <p className="eyebrow">Create · 创作</p>
        <h1>Studio</h1>
        <p>草稿与发布工具将在这里保持克制地展开。</p>
      </header>
      {personaNotice && personaNotices[personaNotice] ? <p className="studio-notice">{personaNotices[personaNotice]}</p> : null}
      <section className="studio-overview" aria-labelledby="drafts-title">
        <div>
          <p className="studio-kicker">Current</p>
          <h2 id="drafts-title">Content drafts</h2>
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
      <section className="studio-inbox studio-media-space" aria-labelledby="media-title">
        <div className="studio-inbox-heading"><div><p className="studio-kicker">Space · Media</p><h2 id="media-title">Media Library</h2></div><strong>{media.length}</strong></div>
        <p className="studio-muted">Owner 上传后在服务端验证真实图片、生成 WebP / AVIF 多尺寸变体；原始文件名不会进入对象地址。</p>
        <MediaUploadForm />
        {media.length ? <div className="studio-media-grid">{media.map((item) => {
          const thumbnail = item.variants.find((variant) => variant.name === 'thumb-webp') ?? item.variants[0]
          return <article key={item.id}>{thumbnail ? <img src={thumbnail.publicUrl} alt={item.altText} width={thumbnail.width} height={thumbnail.height} /> : null}<div><strong>{item.originalName}</strong><span>{item.width}×{item.height}</span><small>{item.altText || 'No alt text'}</small></div></article>
        })}</div> : null}
      </section>
      <section className="studio-inbox studio-persona-space" aria-labelledby="persona-title">
        <div className="studio-inbox-heading">
          <div><p className="studio-kicker">Space · Persona</p><h2 id="persona-title">AI Persona permissions</h2></div>
          <strong>{personas.length}</strong>
        </div>
        <p className="studio-muted">Circle 的发布、评论/回复、转发和配图权限彼此独立；任何权限都只允许生成待审提案，不允许自动公开。</p>
        <div className="studio-persona-list">
          {personas.map((persona) => <form action={updatePersonaAction} className="studio-persona-card" key={persona.id}>
            <input type="hidden" name="id" value={persona.id} />
            <div className="studio-persona-identity"><input name="name" defaultValue={persona.name} required maxLength={120} /><input name="handle" defaultValue={`@${persona.handle}`} required maxLength={80} /></div>
            <textarea name="description" defaultValue={persona.description} rows={2} maxLength={2_000} placeholder="公开身份说明" />
            <textarea name="systemPrompt" defaultValue={persona.systemPrompt} rows={3} required maxLength={8_000} aria-label={`${persona.name} system prompt`} />
            <div className="studio-persona-permissions">
              <label><input type="checkbox" name="enabled" defaultChecked={persona.enabled} />Enabled</label>
              <label><input type="checkbox" name="canPost" defaultChecked={persona.canPost} />Post</label>
              <label><input type="checkbox" name="canComment" defaultChecked={persona.canComment} />Comment / Reply</label>
              <label><input type="checkbox" name="canRepost" defaultChecked={persona.canRepost} />Repost</label>
              <label><input type="checkbox" name="canUseImages" defaultChecked={persona.canUseImages} />Image proposal</label>
            </div>
            <button type="submit">Save permissions</button>
          </form>)}
          <form action={createPersonaAction} className="studio-persona-card new">
            <div className="studio-persona-identity"><input name="name" required maxLength={120} placeholder="Persona name" /><input name="handle" required maxLength={80} placeholder="@handle" /></div>
            <textarea name="description" rows={2} maxLength={2_000} placeholder="公开身份说明" />
            <textarea name="systemPrompt" rows={3} required maxLength={8_000} placeholder="角色边界、语气与内容偏好；不会公开展示" />
            <div className="studio-persona-permissions"><label><input type="checkbox" name="enabled" defaultChecked />Enabled</label><label><input type="checkbox" name="canPost" />Post</label><label><input type="checkbox" name="canComment" />Comment / Reply</label><label><input type="checkbox" name="canRepost" />Repost</label><label><input type="checkbox" name="canUseImages" />Image proposal</label></div>
            <button type="submit">Create Persona</button>
          </form>
        </div>
        {personas.length ? <div className="studio-persona-generate">
          <div><p className="studio-kicker">Draft with AI</p><small>{personaAiEnabled ? '生成结果只进入下方审核箱。' : 'AI gateway disabled'}</small></div>
          <form action={generatePersonaReviewAction}><input type="hidden" name="action" value="post" /><select name="personaId" aria-label="Persona for post">{personas.map((persona) => <option value={persona.id} key={persona.id}>{persona.name}</option>)}</select><button disabled={!personaAiEnabled}>Generate post</button></form>
          {moments.length ? <form action={generatePersonaReviewAction}><select name="action" aria-label="Circle action"><option value="comment">Comment</option><option value="repost">Repost</option></select><select name="personaId" aria-label="Persona for interaction">{personas.map((persona) => <option value={persona.id} key={persona.id}>{persona.name}</option>)}</select><select name="targetEntryId" aria-label="Target Moment">{moments.map((moment) => <option value={moment.entryId} key={moment.entryId}>{moment.author.name} · {moment.summary.slice(0, 42)}</option>)}</select><button disabled={!personaAiEnabled}>Generate</button></form> : null}
          {replyTargets.length ? <form action={generatePersonaReviewAction}><input type="hidden" name="action" value="reply" /><select name="personaId" aria-label="Persona for reply">{personas.map((persona) => <option value={persona.id} key={persona.id}>{persona.name}</option>)}</select><select name="replyTarget" aria-label="Target comment">{replyTargets.map((target) => <option value={target.value} key={target.value}>{target.label}</option>)}</select><button disabled={!personaAiEnabled}>Generate reply</button></form> : null}
        </div> : null}
      </section>
      <section className="studio-inbox studio-ai-review" aria-labelledby="ai-review-title">
        <div className="studio-inbox-heading"><div><p className="studio-kicker">Inbox · AI Review</p><h2 id="ai-review-title">Persona proposals</h2></div><strong>{pendingReviews.length}</strong></div>
        {reviews.length === 0 ? <p className="studio-muted">还没有 Persona 提案。</p> : <div className="studio-review-list">
          {reviews.slice(0, 20).map((review) => <article className="studio-review-item" key={review.id}>
            <header><strong>{review.personaName}</strong><span>@{review.personaHandle}</span><em>{review.action}</em><small>{review.status}</small></header>
            {review.imagePrompt ? <p className="studio-image-proposal">Image proposal: {review.imagePrompt}</p> : null}
            {review.status === 'pending' ? <form action={moderatePersonaReviewAction}>
              <input type="hidden" name="reviewId" value={review.id} />
              <textarea name="editedContent" defaultValue={review.content} rows={3} required maxLength={800} />
              {(review.action === 'post' || review.action === 'repost') && media.length ? <select name="mediaObjectId" defaultValue={review.mediaObjectId ?? ''} aria-label="Reviewed library image"><option value="">No image</option>{media.map((item) => <option value={item.id} key={item.id}>{item.originalName} · {item.altText || 'No alt text'}</option>)}</select> : <input type="hidden" name="mediaObjectId" value="" />}
              <div><button type="submit" name="decision" value="approved">Approve & publish</button><button type="submit" name="decision" value="rejected">Reject</button><button type="submit" name="decision" value="deleted">Delete</button></div>
            </form> : <div className="studio-review-closed"><p>{review.reviewedContent || review.content}</p>{review.status === 'approved' ? <form action={deleteApprovedPersonaPublicationAction}><input type="hidden" name="reviewId" value={review.id} /><button type="submit">Delete public item</button></form> : null}</div>}
          </article>)}
        </div>}
      </section>
      <form action={createContentDraftAction} className="studio-create-form">
        <label>
          <span>New content title</span>
          <input name="title" required maxLength={240} />
        </label>
        <label>
          <span>Type</span>
          <select name="type" defaultValue="blog">
            <option value="blog">Blog</option>
            <option value="project">Project</option>
            <option value="moment">Moment</option>
            <option value="page">Page</option>
          </select>
        </label>
        <button type="submit">Create draft</button>
      </form>
      <div className="studio-draft-list">
        {drafts.map((draft) => (
          <Link href={studioContentPath(draft.id)} key={draft.id}>
            <span>{draft.title}<small>{CONTENT_TYPE_CONFIG[draft.type].singular}</small></span>
            <small>Revision {draft.revision}</small>
          </Link>
        ))}
      </div>
    </main>
  )
}
