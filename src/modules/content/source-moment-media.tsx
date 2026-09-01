'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

import type { PublicMomentItem } from '@/modules/persona/repository'

type MediaItem = PublicMomentItem['media'][number]

function variant(media: MediaItem, name: string) {
  return media.variants.find((candidate) => candidate.name === name)
}

export function SourceMomentMedia({ media, detail }: { media: PublicMomentItem['media']; detail: boolean }) {
  const [open, setOpen] = useState<MediaItem | null>(null)
  if (!media.length) return null
  const shown = media.slice(0, 3)
  return <>
    <div className={`source-moment-media n${shown.length}`}>
      {shown.map((item) => {
        const webp = variant(item, detail ? 'large-webp' : 'card-webp') ?? variant(item, 'large-webp')
        const avif = variant(item, detail ? 'large-avif' : 'card-avif') ?? variant(item, 'large-avif')
        if (!webp) return null
        return <button type="button" onClick={() => setOpen(item)} aria-label={`放大图片：${item.altText || 'Moment image'}`} key={item.id}>
          <picture>{avif ? <source srcSet={avif.publicUrl} type="image/avif" /> : null}<img src={webp.publicUrl} alt={item.altText} width={webp.width} height={webp.height} loading="lazy" decoding="async" /></picture>
        </button>
      })}
    </div>
    {open ? createPortal(<div className="source-moment-lightbox" role="dialog" aria-modal="true" aria-label={open.altText || 'Moment image'} onClick={() => setOpen(null)}>
      <button type="button" onClick={() => setOpen(null)} aria-label="关闭图片">×</button>
      {(() => {
        const webp = variant(open, 'large-webp') ?? open.variants[0]
        const avif = variant(open, 'large-avif')
        return webp ? <picture onClick={(event) => event.stopPropagation()}>{avif ? <source srcSet={avif.publicUrl} type="image/avif" /> : null}<img src={webp.publicUrl} alt={open.altText} width={webp.width} height={webp.height} /></picture> : null
      })()}
    </div>, document.body) : null}
  </>
}
