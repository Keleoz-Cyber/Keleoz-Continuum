import Link from 'next/link'
import { NativeOwnerFrame } from '@/modules/source-native/frame'
import { publishSourceProfile } from '@/modules/site-config/actions'
export default async function Profile({searchParams}:{searchParams:Promise<{error?:string}>}){
  const query=await searchParams
  return <><NativeOwnerFrame page="about"/><div className="native-profile-publish"><Link href="/studio/settings">← 站点配置</Link><span>{query.error?'发布失败，请检查已保存的资料与上传图片。':'先在原版编辑器保存，再发布指定的公开资料。'}</span><form action={publishSourceProfile}><button className="btn">发布已保存资料</button></form></div></>
}
