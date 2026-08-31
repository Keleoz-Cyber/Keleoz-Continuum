import type { Metadata } from 'next'

import { getCachedPublicBySlug } from '@/modules/content/cache'
import { PublicAbout } from '@/modules/content/public-about'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export const metadata: Metadata = { title: 'About', description: 'About Keleoz Continuum.' }
export const dynamic = 'force-dynamic'
export default async function AboutPage() { const page = await getCachedPublicBySlug('page', 'about'); return <main className="source-public-page source-about-page"><div className="source-public-bg" aria-hidden="true" /><SourcePublicNav current="about" /><section className="source-page active"><header className="source-about-heading"><h2>About</h2><span>PROFILE · 个人名片</span></header><PublicAbout page={page} /></section></main> }
