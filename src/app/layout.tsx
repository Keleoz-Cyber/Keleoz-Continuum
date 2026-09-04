import type { Metadata } from 'next'

import './globals.css'
import './source-home.css'
import './source-public.css'
import './source-music.css'
import './source-room.css'
import './source-home-frame.css'
import './source-tea-mobile.css'
import './source-story-mobile.css'
import './source-tarot-mobile.css'
import './source-character-mobile.css'
import './source-continuity.css'
import './source-studio.css'

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* The source project uses this exact Google Fonts stylesheet for its typography. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Great+Vibes&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@400;500;600&family=Pinyon+Script&family=Raleway:wght@200;300&family=Spectral:ital,wght@1,300&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  )
}
