'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type WorkspaceWindow = Window & {
  __continuumFlush?: () => Promise<void>
  __continuumToggleTheme?: () => void
  __continuumPreviewDesk?: () => void
}

function workspaceWindow() {
  return document.querySelector<HTMLIFrameElement>('.native-owner-frame')?.contentWindow as WorkspaceWindow | null
}

export function PublishFooter({ action, status, appearance = false }: { action: () => Promise<void>; status: string; appearance?: boolean }) {
  const [message, setMessage] = useState('')
  const router=useRouter()
  const footer = useRef<HTMLDivElement>(null)
  const flush = async () => {
    const win = workspaceWindow()
    if (!win?.__continuumFlush) throw new Error('页面尚未加载完成')
    await win.__continuumFlush()
  }
  const changeSurface = async (view: 'desktop' | 'mobile') => {
    try { await flush(); router.push('/studio/appearance?view=' + view) }
    catch { setMessage('请等待保存完成或处理保存冲突后，再切换界面。') }
  }
  useEffect(() => {
    const node = footer.current, host = node?.closest<HTMLElement>('.source-studio')
    if (!node || !host) return
    const sync = () => host.style.setProperty('--native-publish-height', node.getBoundingClientRect().height + 'px')
    const observer = new ResizeObserver(sync)
    observer.observe(node); sync()
    return () => { observer.disconnect(); host.style.removeProperty('--native-publish-height') }
  }, [])
  return <div ref={footer} className="native-profile-publish">
    <Link href="/studio/settings">← 站点配置</Link>
    {appearance ? <>
      <a href="/studio/appearance?view=desktop" onClick={event => { event.preventDefault(); void changeSurface('desktop') }}>Desktop 素材</a>
      <a href="/studio/appearance?view=mobile" onClick={event => { event.preventDefault(); void changeSurface('mobile') }}>Mobile 布局</a>
    </> : null}
    <button className="btn" type="button" onClick={() => workspaceWindow()?.__continuumToggleTheme?.()}>Internal / Infernal</button>
    {appearance ? <button className="btn" type="button" onClick={() => workspaceWindow()?.__continuumPreviewDesk?.()}>预览桌面 / 返回设置</button> : null}
    <span role="status">{message || status}</span>
    <form action={async () => {
      try { setMessage('正在保存并发布…'); await flush(); await action(); setMessage('') }
      catch { setMessage('未发布：请等待保存完成；若有记录冲突，请重新打开后再操作。') }
    }}><button className="btn">发布已保存{appearance ? '外观' : '资料'}</button></form>
  </div>
}
