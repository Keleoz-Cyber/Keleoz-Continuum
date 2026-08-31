'use client'

import Link from 'next/link'
import { useState } from 'react'

export function GuestCommentButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="source-comment-button" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.6c0 4-3.6 7.2-8 7.2-1 0-2-.2-2.9-.5L4 20l1.5-3.6A7 7 0 0 1 4 11.6c0-4 3.6-7.2 8-7.2s8 3.2 8 7.2z" /></svg>
        评论
      </button>
      {open ? (
        <div className="source-comment-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}>
          <section className="source-comment-dialog" role="dialog" aria-modal="true" aria-labelledby="comment-notice-title">
            <h2 id="comment-notice-title">Comments · 评论</h2>
            <p>评论仅对登录成员开放。第一版暂未开放成员注册，你可以前往 Letters 留下一封匿名或署名来信。</p>
            <div><button type="button" onClick={() => setOpen(false)}>返回</button><Link href="/letters">前往 Letters</Link></div>
          </section>
        </div>
      ) : null}
    </>
  )
}
