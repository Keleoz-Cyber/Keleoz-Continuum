import Link from 'next/link'

import type { PublicMomentItem } from '@/modules/persona/repository'
import { GuestCommentButton } from './guest-comment-button'
import { SourceMomentMedia } from './source-moment-media'
import type { PublicSiteConfig } from '@/modules/site-config/contracts'

function MomentAuthor({ item,settings }: { item: PublicMomentItem;settings?:PublicSiteConfig }) {
  const name=item.author.isAi?item.author.name:settings?.name??item.author.name
  const avatar=!item.author.isAi?settings?.avatarUrl:null
  return <>
    <span className={`source-moment-avatar${item.author.isAi ? ' persona' : ''}`} style={avatar?{backgroundImage:`url("${avatar}")`,backgroundSize:'cover',backgroundPosition:'center'}:undefined} aria-hidden="true">{avatar?null:name.slice(0, 1).toUpperCase()}</span>
    <span className="source-moment-author"><strong>{name}</strong><small>{item.author.handle}</small></span>
    {item.author.isAi ? <span className="source-moment-ai">AI Persona</span> : null}
  </>
}

export function PublicMomentCard({ item, detail = false,settings }: { item: PublicMomentItem; detail?: boolean;settings?:PublicSiteConfig }) {
  return <article className={`source-moment-card glass-card${detail ? ' source-moment-detail' : ''}`}>
    <header>
      <MomentAuthor item={item} settings={settings}/>
      <i>/</i>
      <time dateTime={item.publishedAt} title={new Date(item.publishedAt).toLocaleString('zh-CN')}>{detail ? new Date(item.publishedAt).toLocaleString('zh-CN') : new Date(item.publishedAt).toLocaleDateString('zh-CN')}</time>
      {item.categoryLabel ? <em>{item.categoryLabel}</em> : null}
    </header>
    {detail ? <>
      <h1>{item.title}</h1>
      {item.exposure === 'summary' ? <p>{item.summary}</p> : <div className="post-view-content" dangerouslySetInnerHTML={{ __html: item.bodyHtml ?? '' }} />}
    </> : <Link className="source-moment-copy" href={`/moments/${item.slug}`}>
      {item.title ? <h2>{item.title}</h2> : null}
      <p>{item.summary || item.subtitle || '打开这条动态。'}</p>
    </Link>}
    <SourceMomentMedia media={item.media} detail={detail} />
    {item.repost ? <Link className="source-moment-repost" href={`/moments/${item.repost.slug}`}>
      <span aria-hidden="true">↗</span><b>{item.repost.author.name}</b><small>{item.repost.author.handle}</small>
      <p>{item.repost.summary || item.repost.title}</p>
    </Link> : null}
    {item.comments.length ? <div className="source-moment-comments">
      {item.comments.map((comment) => <p key={comment.id}>
        <b>{comment.author.name}</b>{comment.replyToName ? <><span> 回复 </span><b>{comment.replyToName}</b></> : null}<span>：{comment.content}</span>
        {comment.author.isAi ? <small>AI</small> : null}
      </p>)}
    </div> : null}
    <footer><GuestCommentButton /></footer>
  </article>
}

export function PublicMoments({ items,settings }: { items: PublicMomentItem[];settings?:PublicSiteConfig }) {
  if (items.length === 0) return <div className="source-moment-empty glass-card">还没有动态。<br />这里会记录短暂的想法、照片与近况。</div>
  return (
    <div className="source-moment-feed">
      {items.map((item) => <PublicMomentCard item={item} key={item.slug} settings={settings}/>)}
    </div>
  )
}
