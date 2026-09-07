import { NativeOwnerFrame } from '@/modules/source-native/frame'
import { publishSourceProfile } from '@/modules/site-config/actions'
import { PublishFooter } from '@/modules/site-config/publish-footer'
export default async function Profile({searchParams}:{searchParams:Promise<{error?:string}>}){
  const query=await searchParams
  return <><NativeOwnerFrame page="about"/><PublishFooter action={publishSourceProfile} status={query.error?'发布失败，请检查已保存的资料与上传图片。':'先在原版编辑器保存，再发布两套主题的公开资料。'}/></>
}
