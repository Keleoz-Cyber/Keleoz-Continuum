import type { PublicContentDto } from './dto'

export function PublicAbout({ page }: { page: PublicContentDto | null }) {
  const body = page?.exposure === 'full' ? page.bodyHtml : null
  const summary = page?.summary || '一个持续生长的个人数字空间。阅读、记录、实验，也保留一些可以进入的房间。'
  return (
    <article className="source-about-card">
      <section className="source-about-identity">
        <div className="source-about-avatar" aria-hidden="true">K</div>
        <h1>{page?.title || 'Keleoz'}</h1>
        <p>@KeleozContinuum</p>
      </section>
      <section className="source-about-bio">
        <p className="source-about-kicker">A Personal Digital Space.</p>
        {body ? <div className="source-about-content" dangerouslySetInnerHTML={{ __html: body }} /> : <p>{summary}</p>}
        {page?.exposure === 'summary' ? <small>完整介绍暂未公开</small> : null}
      </section>
      <section className="source-about-gallery" aria-label="Profile gallery">
        <div><span>I</span></div><div><span>II</span></div><div><span>III</span></div>
      </section>
    </article>
  )
}
