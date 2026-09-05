import { notFound, redirect } from 'next/navigation'
import { contentRepository } from '@/modules/content/runtime'
import { NativeOwnerFrame } from '@/modules/source-native/frame'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await contentRepository.getDraftById(id)
  if (!draft) notFound()
  if (draft.type !== 'blog') redirect(`/studio/content/${id}/advanced`)
  return <NativeOwnerFrame page="blog" edit={id} />
}
