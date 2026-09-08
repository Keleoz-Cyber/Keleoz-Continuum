import type { Metadata } from 'next'
import { PersistentScene } from '@/modules/home/persistent-scene'

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
import './source-native.css'

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
        {/* Original font families and subsets, served locally with their licenses. */}
        {/* Shared with the original iframe documents; intentionally not a bundled CSS import. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/source.css" />
      </head>
      <body><PersistentScene>{children}</PersistentScene></body>
    </html>
  )
}
