import { NativeOwnerFrame } from '@/modules/source-native/frame'
import { z } from 'zod'
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const contentType = z.enum(['blog', 'project', 'moment', 'page']).catch('blog').parse(type)
  return <NativeOwnerFrame page="blog" edit="new" contentType={contentType} />
}
