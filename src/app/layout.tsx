import type { Metadata } from 'next'

import './globals.css'
import './source-home.css'
import './source-public.css'
import './source-music.css'
import './source-room.css'

export const metadata: Metadata = {
  title: {
    default: 'Keleoz Continuum',
    template: '%s · Keleoz Continuum',
  },
  description: 'A Personal Digital Space. 一个持续生长的个人数字空间。',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
