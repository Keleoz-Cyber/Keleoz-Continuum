'use client'

import { useMemo,useSyncExternalStore } from 'react'

// Select a shell once per workspace. Resizing an open workspace must not destroy
// the source runtime and its unsaved editor/chat/modal state.
function subscribe() { return () => {} }

export function NativeOwnerFrame({ page, edit, contentType = 'blog',surface }: { page: 'blog' | 'chat' | 'memory' | 'api' | 'about' | 'calendar' | 'appearance'; edit?: string; contentType?: 'blog' | 'project' | 'moment' | 'page';surface?:'desktop'|'mobile' }) {
  const workspace=useMemo(()=>{let selected:boolean|null=null;return {identity:`${page}:${edit||''}:${contentType}:${surface||'auto'}`,snapshot:()=>selected??=(surface?surface==='mobile':window.matchMedia('(max-width: 900px)').matches)}},[page,edit,contentType,surface])
  const mobile = useSyncExternalStore(subscribe, workspace.snapshot, () => null)
  if (mobile === null) return <div className="native-owner-frame" aria-busy="true" />
  const params = new URLSearchParams({ page, type: contentType, ...(edit ? { edit } : {}), ...(mobile ? { mobile: '1' } : {}) })
  return <iframe key={mobile ? 'mobile' : 'desktop'} data-workspace={workspace.identity} data-surface={surface} className={`native-owner-frame${mobile ? ' native-mobile' : ''}`} title={`原版 ${page} 工作空间`} src={`/api/studio/source-document?${params}`} />
}
