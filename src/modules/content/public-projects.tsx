import Link from 'next/link'

import type { PublicContentListItem } from './dto'

export function PublicProjects({ items }: { items: PublicContentListItem[] }) {
  if (items.length === 0) return <div className="empty-state"><span>◇</span>还没有公开项目。</div>
  return (
    <div className="source-project-list">
      {items.map((item, index) => (
        <Link className="source-project-entry" href={`/projects/${item.slug}`} key={item.slug}>
          <span className="source-project-index">{String(index + 1).padStart(2, '0')}</span>
          <div>
            <small>{item.categoryLabel ?? 'In progress'}</small>
            <h2>{item.title}</h2>
            {item.subtitle ? <p className="source-project-subtitle">{item.subtitle}</p> : null}
            <p>{item.summary || '打开项目记录。'}</p>
          </div>
          <time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</time>
        </Link>
      ))}
    </div>
  )
}
