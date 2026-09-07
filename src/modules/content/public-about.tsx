import type { PublicContentDto } from './dto'
import type { PublicSiteConfig } from '@/modules/site-config/contracts'
import { ThemedProfile } from './themed-profile'

export function PublicAbout({ page,settings }: { page: PublicContentDto | null;settings:PublicSiteConfig }) {
  const body = page?.exposure === 'full' ? page.bodyHtml : null
  const summary = page?.summary || '一个持续生长的个人数字空间。阅读、记录、实验，也保留一些可以进入的房间。'
  return (
    <ThemedProfile settings={settings}>
      <section className="source-about-bio">
        <p className="source-about-kicker">{settings.tagline}</p>
        <p style={{whiteSpace:'pre-wrap'}}>{settings.bio||summary}</p>
        {settings.customText?<p style={{whiteSpace:'pre-wrap'}}>{settings.customText}</p>:null}
        {body ? <div className="source-about-content" dangerouslySetInnerHTML={{ __html: body }} /> : null}
        {page?.exposure === 'summary' ? <small>完整介绍暂未公开</small> : null}
      </section>
    </ThemedProfile>
  )
}
