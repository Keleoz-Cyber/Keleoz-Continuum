import { NativeOwnerFrame } from '@/modules/source-native/frame'
import { publishSourceAppearance } from '@/modules/site-config/actions'
import { PublishFooter } from '@/modules/site-config/publish-footer'

export default async function Appearance({searchParams}:{searchParams:Promise<{error?:string;saved?:string;view?:string}>}){
  const query=await searchParams
  const surface=query.view==='mobile'?'mobile':query.view==='desktop'?'desktop':undefined
  return <><NativeOwnerFrame page="appearance" surface={surface}/><PublishFooter action={publishSourceAppearance.bind(null,surface)} appearance status={query.error?'发布失败：请检查图片和参数，旧的公开外观没有改变。':query.saved?'外观已发布。':'原版布局与 Visual 设置。发布后对外生效；聊天背景和私人同行者不会公开。'}/></>
}
