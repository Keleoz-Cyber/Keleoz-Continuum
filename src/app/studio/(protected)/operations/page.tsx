import { requireOwner } from '@/modules/auth/dal'
import { recordIndependentDownloadAction, setGuestAiEnabledAction } from '@/modules/operations/actions'
import { describeLatestBackupStatus, describeMediaCoverage } from '@/modules/operations/contracts'
import { getBackupOverview, operationsRepository } from '@/modules/operations/runtime'
import { serverEnv } from '@/shared/env'

const featureNames = { tea: 'Tea', story: 'Story', tarot: 'Tarot', persona: 'Persona', chat: 'Owner Chat' } as const
const aiNotices: Record<string, string> = {
  paused: 'Guest AI 已暂停；公开内容、Room 非 AI 功能和 Owner Persona 审核不受影响。',
  resumed: 'Guest AI 运行时开关已恢复；环境总开关和费用配额仍会继续生效。',
  invalid: '未识别这次开关操作，设置没有改变。',
}

function formatMicroUsd(value: number) {
  return `$${(value / 1_000_000).toFixed(6)}`
}

function formatDate(value: Date | string | null) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(value))
}

export default async function StudioOperationsPage({ searchParams }: { searchParams: Promise<{ ai?: string; copy?: string }> }) {
  const [owner, params] = await Promise.all([requireOwner(), searchParams])
  const now = new Date()
  const [settings, usage, backup] = await Promise.all([
    operationsRepository.getSettings(),
    operationsRepository.getAiUsageSummary({
      now,
      dailyBudgetMicroUsd: serverEnv.AI_DAILY_BUDGET_MICRO_USD,
      inputMicroUsdPerMillionTokens: serverEnv.AI_INPUT_MICRO_USD_PER_MILLION_TOKENS,
      outputMicroUsdPerMillionTokens: serverEnv.AI_OUTPUT_MICRO_USD_PER_MILLION_TOKENS,
    }),
    getBackupOverview(now),
  ])
  const environmentReady = serverEnv.AI_GATEWAY_ENABLED
  const guestAiAvailable = environmentReady && settings.guestAiEnabled
  const budgetPercent = serverEnv.AI_DAILY_BUDGET_MICRO_USD > 0
    ? Math.min(100, usage.reservedCostMicroUsd / serverEnv.AI_DAILY_BUDGET_MICRO_USD * 100)
    : 0

  return (
    <main className="studio-main studio-operations-page">
      <header className="studio-title-block">
        <p className="eyebrow">Owner · Operations</p>
        <h1>Continuity</h1>
        <p>运行开关、费用边界、数据导出与备份状态。密钥仍只存在服务器环境中。</p>
      </header>
      {params.ai && aiNotices[params.ai] ? <p className="studio-notice">{aiNotices[params.ai]}</p> : null}
      {params.copy === 'recorded' ? <p className="studio-notice">独立副本时间已记录。请确认下载文件已保存在云服务器之外。</p> : null}

      <section className="operations-section" aria-labelledby="ai-operations-title">
        <header className="operations-heading">
          <div><p className="studio-kicker">Gateway · AI</p><h2 id="ai-operations-title">Guest AI control</h2></div>
          <span className={`operations-status ${guestAiAvailable ? 'ready' : 'paused'}`}>{guestAiAvailable ? 'Available' : 'Unavailable'}</span>
        </header>
        <div className="operations-status-grid">
          <article><small>Environment</small><strong>{environmentReady ? 'Configured' : 'Disabled'}</strong><span>{serverEnv.AI_MODEL ?? 'No provider model'}</span></article>
          <article><small>Runtime fuse</small><strong>{settings.guestAiEnabled ? 'Accepting Guest AI' : 'Paused by Owner'}</strong><span>Updated {formatDate(settings.updatedAt)}</span></article>
          <article><small>Owner</small><strong>{owner.username}</strong><span>Persona review remains separate</span></article>
          <article><small>Media storage</small><strong>{serverEnv.MEDIA_DRIVER === 'lightcos' ? 'LightCOS' : 'Local volume'}</strong><span>Provider credentials are not displayed</span></article>
        </div>
        <form action={setGuestAiEnabledAction} className="operations-switch-form">
          <input type="hidden" name="enabled" value={settings.guestAiEnabled ? 'false' : 'true'} />
          <div><strong>{settings.guestAiEnabled ? 'Pause Guest AI' : 'Resume Guest AI'}</strong><p>只影响 Tea、Story 与 Tarot 的新请求；不会隐藏已有内容。</p></div>
          <button type="submit">{settings.guestAiEnabled ? 'Pause' : 'Resume'}</button>
        </form>
      </section>

      <section className="operations-section" aria-labelledby="ai-usage-title">
        <header className="operations-heading">
          <div><p className="studio-kicker">Today · UTC</p><h2 id="ai-usage-title">Usage & cost</h2></div>
          <span>{usage.totalRequests} requests</span>
        </header>
        <div className="operations-metrics">
          <article><small>Reserved ceiling</small><strong>{formatMicroUsd(usage.reservedCostMicroUsd)}</strong><span>{usage.remainingBudgetMicroUsd ? `${formatMicroUsd(usage.remainingBudgetMicroUsd)} remaining` : 'No configured remainder'}</span></article>
          <article><small>Measured estimate</small><strong>{formatMicroUsd(usage.measuredCostMicroUsd)}</strong><span>Completed token usage only</span></article>
          <article><small>Guest sources</small><strong>{usage.guestUniqueSources}</strong><span>Distinct privacy-safe count</span></article>
          <article><small>Request state</small><strong>{usage.completedRequests} / {usage.failedRequests} / {usage.pendingRequests}</strong><span>Completed / failed / pending</span></article>
        </div>
        <div className="operations-budget" aria-label={`Daily reserved budget ${budgetPercent.toFixed(1)} percent`}><span style={{ width: `${budgetPercent}%` }} /></div>
        <div className="operations-feature-list">
          {usage.features.map((feature) => <div key={feature.feature}><strong>{featureNames[feature.feature]}</strong><span>{feature.requests} requests</span><span>{formatMicroUsd(feature.reservedCostMicroUsd)} reserved</span><span>{formatMicroUsd(feature.measuredCostMicroUsd)} measured</span></div>)}
        </div>
        <p className="operations-footnote">费用是按当前配置单价计算的运行估算，不替代供应商最终账单。硬上限按预留成本执行。</p>
      </section>

      <section className="operations-section" aria-labelledby="continuity-title">
        <header className="operations-heading"><div><p className="studio-kicker">Data · Continuity</p><h2 id="continuity-title">Export & backup</h2></div></header>
        <div className="operations-continuity-grid">
          <article>
            <small>Portable JSON</small><strong>Content & configuration</strong>
            <p>包含草稿、版本、Letters、媒体清单与 Persona 配置；不包含密码、会话、访客指纹、API 密钥或媒体二进制。</p>
            <a href="/api/studio/export" download>Download current export</a>
            <span>Weekly snapshot: {backup.latestPortableExport ? formatDate(backup.latestPortableExport.createdAt) : 'Not generated'} · {backup.portableExportCount}/4 retained</span>
          </article>
          <article>
            <small>Latest PostgreSQL backup</small><strong>{backup.latestBackup && backup.latestFileExists ? formatDate(backup.latestBackup.createdAt) : 'No verified file'}</strong>
            <p>{backup.manifestError ?? describeLatestBackupStatus(backup.latestBackup, backup.latestFileExists)}</p>
            <p>{describeMediaCoverage(backup.latestBackup)}</p>
            <span>Daily {backup.counts.daily}/7 · Weekly {backup.counts.weekly}/4 · Monthly {backup.counts.monthly}/6</span>
          </article>
          <article>
            <small>Latest backup restore</small><strong>{backup.restoreVerified ? 'Passed' : 'Not verified'}</strong>
            <p>{backup.lastRestoreDrill ? `${formatDate(backup.lastRestoreDrill.checkedAt)} · ${backup.lastRestoreDrill.tableCount ?? 0} tables` : 'No restore drill has been recorded yet.'}</p>
            <span>{backup.lastRestoreDrill?.error ?? 'Restore checks run against an isolated temporary database.'}</span>
            <p>{backup.restoreVerified && backup.lastRestoreDrill?.mediaStatus === 'verified-local'
              ? `数据库及 ${backup.lastRestoreDrill.mediaFileCount ?? 0} 个本地媒体文件已通过隔离恢复校验。`
              : '尚未验证当前备份的完整媒体恢复；数据库恢复通过不代表媒体已备份。'}</p>
          </article>
          <article>
            <small>Independent copy</small><strong>{backup.independentDownloadDue ? 'Download due' : 'Current'}</strong>
            <p>Last recorded: {formatDate(backup.lastIndependentDownloadAt)}</p>
            <span>每月保留一份不依赖云服务器的副本。</span>
            <form action={recordIndependentDownloadAction}><button type="submit">Mark local copy saved</button></form>
          </article>
        </div>
      </section>
    </main>
  )
}
