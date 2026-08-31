import Link from 'next/link'

import type { PublicContentListItem } from './dto'
import { GuestCommentButton } from './guest-comment-button'

export function PublicMoments({ items }: { items: PublicContentListItem[] }) {
  if (items.length === 0) return <div className="source-moment-empty glass-card">还没有动态。<br />这里会记录短暂的想法、照片与近况。</div>
  return (
    <div className="source-moment-feed">
      {items.map((item) => (
        <article className="source-moment-card glass-card" key={item.slug}>
          <header>
            <span className="source-moment-avatar" aria-hidden="true">K</span>
            <span className="source-moment-author"><strong>Keleoz</strong><small>@KeleozContinuum</small></span>
            <i>/</i>
            <time dateTime={item.publishedAt} title={new Date(item.publishedAt).toLocaleString('zh-CN')}>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</time>
            {item.categoryLabel ? <em>{item.categoryLabel}</em> : null}
          </header>
          <Link className="source-moment-copy" href={`/moments/${item.slug}`}>
            {item.title ? <h2>{item.title}</h2> : null}
            <p>{item.summary || item.subtitle || '打开这条动态。'}</p>
          </Link>
          <footer><GuestCommentButton /></footer>
        </article>
      ))}
    </div>
  )
}
