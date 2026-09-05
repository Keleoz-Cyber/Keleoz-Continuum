import Link from 'next/link'
import { siteConfigRepository } from '@/modules/site-config/runtime'
import { saveSiteConfig } from '@/modules/site-config/actions'
import { mediaService } from '@/modules/media/runtime'
import { CHARACTER_OUTFITS } from '@/modules/character/mobile-state'
export default async function Settings({searchParams}:{searchParams:Promise<{saved?:string;profile?:string;error?:string}>}){
  const [config,media,query]=await Promise.all([siteConfigRepository.read(),mediaService.listReady(),searchParams])
  return <main className="studio-main publication-settings"><section className="module-intro"><div className="module-intro-top"><h1>Space</h1><span className="module-intro-sub">站点配置</span></div><div className="module-intro-rule"/><nav className="native-studio-tabs"><Link href="/studio">返回 Studio</Link><Link href="/studio/profile">编辑原版 Profile</Link><Link href="/studio?section=media">媒体库</Link><Link href="/about">查看公开资料</Link></nav></section>
    {query.saved||query.profile?<p className="studio-notice">公开配置已更新。</p>:null}{query.error?<p role="alert">保存失败：配置可能已在另一窗口更新，或所选媒体已不可用。请刷新后重试。</p>:null}
    <section className="studio-inbox"><h2>Profile</h2><p>当前公开名称：{config.name}</p><p>{config.bio}</p><p>在原版 Profile 中编辑并保存，再点击“发布已保存资料”。只发布昵称、简介、自定义文字、头像、封面和三张画廊图片；不会公开生日、联系方式或私人记录。</p><Link className="btn" href="/studio/profile">编辑资料</Link></section>
    <section className="studio-inbox"><form action={saveSiteConfig} className="source-memory-form"><input type="hidden" name="revision" value={config.revision}/>
      <label>英文副标题<input name="tagline" defaultValue={config.tagline} maxLength={120} required/></label><label>首页中文介绍<textarea name="introduction" defaultValue={config.introduction} maxLength={300} rows={3}/></label>
      <label>首页默认主题<select name="theme" defaultValue={config.theme}><option value="internal">Internal · 明亮</option><option value="infernal">Infernal · 深色</option></select></label>
      <label>Room / Character 初始服装<select name="roomOutfit" defaultValue={config.roomOutfit}>{CHARACTER_OUTFITS.map((outfit,index)=><option key={outfit.id} value={index}>{outfit.label}</option>)}</select></label>
      <p>主题是新访客的默认值；服装只在没有本机存档时应用，不覆盖访客自己的选择。</p>
      <fieldset><legend>站点默认歌单（最多 30 首，不自动播放）</legend>{media.filter(item=>item.kind==='audio').map(item=><label key={item.id}><input style={{width:'auto'}} type="checkbox" name="playlist" value={item.id} defaultChecked={config.playlist.includes(item.id)}/>{item.originalName}</label>)}{!media.some(item=>item.kind==='audio')?<p>媒体库尚无音频，请先上传。</p>:null}</fieldset>
      <button>保存并应用公开配置</button></form></section></main>
}
