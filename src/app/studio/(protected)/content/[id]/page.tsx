import { notFound, redirect } from 'next/navigation'
import { contentRepository } from '@/modules/content/runtime'
import { NativeOwnerFrame } from '@/modules/source-native/frame'
import { isSourceEditable } from '@/modules/source-native/posts'
import { tiptapDocumentSchema } from '@/modules/content/schemas'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await contentRepository.getDraftById(id)
  if (!draft) notFound()
  if (!isSourceEditable(tiptapDocumentSchema.parse(draft.document))) redirect(`/studio/content/${id}/advanced`)
  return <NativeOwnerFrame page="blog" edit={id} contentType={draft.type} />
}
