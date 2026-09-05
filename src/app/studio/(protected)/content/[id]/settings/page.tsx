import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOwner } from '@/modules/auth/dal'
import { publishContentAction } from '@/modules/content/actions'
import { contentRepository } from '@/modules/content/runtime'
import { tiptapDocumentSchema } from '@/modules/content/schemas'
import { ContentVersionHistory } from '@/modules/editor/content-version-history'

async function saveSettings(data: FormData) {
  'use server'
  await requireOwner()
  const id = z.uuid().parse(data.get('id'))
  const draft = await contentRepository.getDraftById(id)
  if (!draft) notFound()
  await contentRepository.saveDraft({ entryId: id, expectedRevision: Number(data.get('revision')), snapshot: { title: draft.title, subtitle: draft.subtitle, categoryLabel: draft.categoryLabel, summary: z.string().max(2000).parse(data.get('summary') || ''), exposure: z.enum(['full','summary','hidden']).parse(data.get('exposure')), document: tiptapDocumentSchema.parse(draft.document) } })
  revalidatePath('/studio')
  if (data.get('intent') === 'publish') {
    const publishData = new FormData()
    publishData.set('entryId', id)
    return publishContentAction(publishData)
  }
  redirect(`/studio/content/${id}/settings?saved=1`)
}

export default async function Settings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [draft, versions] = await Promise.all([contentRepository.getDraftById(id), contentRepository.listVersions(id)])
  if (!draft) notFound()
  return <main className="studio-main publication-settings">
    <section className="module-intro"><div className="module-intro-top"><h1>{draft.title}</h1><span className="module-intro-sub">Publication</span></div><div className="module-intro-rule" />
      <nav className="native-studio-tabs"><Link href={`/studio/content/${id}`}>← 返回写作</Link><Link href={`/studio/content/${id}/advanced`}>块编辑与媒体</Link><Link href={`/studio/content/${id}/preview`}>访客预览</Link><Link href="/studio?section=manage">发布管理</Link></nav>
    </section>
    <section className="studio-inbox">
      <form action={saveSettings} className="source-memory-form">
        <input type="hidden" name="id" value={id}/><input type="hidden" name="revision" value={draft.revision}/>
        <label>公开范围<select name="exposure" defaultValue={draft.exposure}><option value="hidden">私人草稿</option><option value="full">公开全文</option><option value="summary">仅公开摘要</option></select></label>
        <label>公开摘要<textarea name="summary" defaultValue={draft.summary} rows={4} maxLength={2000}/></label>
        <p>设置只影响草稿。“保存并发布”会先保存此处设置；版本恢复不会自动改动公开页面。</p>
        <button>保存发布设置</button>
        <button className="btn" name="intent" value="publish">保存并发布</button>
      </form>
    </section>
    <ContentVersionHistory entryId={id} draftRevision={draft.revision} versions={versions.map(version=>({...version,createdAt:version.createdAt.toISOString()}))}/>
  </main>
}
