'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  const query = window.matchMedia('(max-width: 900px)')
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

export function NativeOwnerFrame({ page, edit, contentType = 'blog' }: { page: 'blog' | 'chat' | 'memory' | 'api' | 'about' | 'calendar'; edit?: string; contentType?: 'blog' | 'project' | 'moment' | 'page' }) {
  const mobile = useSyncExternalStore(subscribe, () => window.matchMedia('(max-width: 900px)').matches, () => false)
  const params = new URLSearchParams({ page, type: contentType, ...(edit ? { edit } : {}), ...(mobile ? { mobile: '1' } : {}) })
  return <iframe key={mobile ? 'mobile' : 'desktop'} className={`native-owner-frame${mobile ? ' native-mobile' : ''}`} title={`原版 ${page} 工作空间`} src={`/api/studio/source-document?${params}`} />
}
