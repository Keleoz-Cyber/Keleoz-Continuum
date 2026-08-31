import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCachedPublicMomentBySlug } from '@/modules/content/cache'
import { PublicMomentCard } from '@/modules/content/public-moments'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = await getCachedPublicMomentBySlug(slug); return item ? { title: item.title, description: item.summary || undefined } : {} }
export default async function MomentPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = await getCachedPublicMomentBySlug(slug); if (!item) notFound(); return <main className="source-public-page source-moments-page"><div className="source-public-bg" aria-hidden="true" /><SourcePublicNav current="moments" /><section className="source-page active"><PublicMomentCard item={item} detail /></section></main> }
