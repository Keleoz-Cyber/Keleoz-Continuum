import { notFound,redirect } from 'next/navigation'
import { contentRepository } from '@/modules/content/runtime'
export default async function LegacyBlogEditor({params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const draft=await contentRepository.getDraftById(id)
  if(!draft||draft.type!=='blog')notFound()
  redirect(`/studio/content/${id}`)
}
