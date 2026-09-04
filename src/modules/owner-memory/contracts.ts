export type OwnerMemoryVisibility = 'public' | 'only' | 'except' | 'private'

export type OwnerMemoryRecord = {
  id: string
  title: string
  summary: string
  content: string
  oneLine: string
  domain: string
  tags: string[]
  valence: number
  arousal: number
  importance: number
  pinned: boolean
  resolved: boolean
  visibility: OwnerMemoryVisibility
  visibleTo: string[]
  excludeFrom: string[]
  activationCount: number
  createdAt: Date
  lastActivatedAt: Date
  createdByCompanionId: string | null
  createdByName: string | null
}

export type AutoMemoryRecord = {
  id: string
  category: string
  priority: 'always' | 'normal' | 'low'
  content: string
  createdAt: Date
  updatedAt: Date
}

export type AutoMemoryOperation = {
  kind: 'create' | 'update' | 'delete'
  category: string | null
  priority: string | null
  id: string | null
  content: string
}

const MEMORY_DOMAINS = new Set(['情感', '日常', '创作', '思考'])

export function calculateMemoryScore(memory: OwnerMemoryRecord, now = new Date()): number {
  if (memory.pinned) return 999
  const daysSince = Math.max(0, (now.getTime() - memory.lastActivatedAt.getTime()) / 86_400_000)
  const lambda = memory.resolved ? 0.12 : 0.05
  const emotionFactor = 1 + (memory.arousal || 0.3) * 0.8
  const activationCount = Math.max(0, memory.activationCount || 0)
  const activationFactor = 1 + activationCount / (activationCount + 300)
  const score = (memory.importance || 5) * activationFactor * Math.exp(-lambda * daysSince) * emotionFactor
  return Math.round(score * 100) / 100
}

export function isMemoryVisibleTo(memory: OwnerMemoryRecord, companionId: string): boolean {
  const visibility = String(memory.visibility || 'public').toLowerCase()
  if (visibility === 'private') return false
  if (visibility === 'public' || visibility === 'all') return true
  if (visibility === 'only') return memory.visibleTo.includes(companionId)
  if (visibility === 'except') return !memory.excludeFrom.includes(companionId)
  return false
}

export function extractMemoryKeywords(text: string): string[] {
  if (!text) return []
  const keywords: string[] = []
  const cleaned = text.replace(/[\[\]()（）【】「」《》、，。！？；：\s]/g, ' ').trim()
  cleaned.match(/[a-zA-Z]{3,}/g)?.forEach((word) => keywords.push(word.toLowerCase()))
  const chinese = cleaned.replace(/[a-zA-Z0-9\s]+/g, '')
  for (let index = 0; index < chinese.length - 1; index += 1) {
    keywords.push(chinese.slice(index, index + 2))
    if (index < chinese.length - 2) keywords.push(chinese.slice(index, index + 3))
  }
  return [...new Set(keywords)]
}

function memoryRelevance(memory: OwnerMemoryRecord, keywords: string[]): number {
  if (!keywords.length) return 1
  const haystack = `${memory.title}|${memory.content}|${memory.tags.join('|')}|${memory.domain}`.toLowerCase()
  const hits = keywords.reduce((total, keyword) => total + Number(haystack.includes(keyword)), 0)
  return 1 + hits / keywords.length * 1.5
}

function formatMemoryLine(memory: OwnerMemoryRecord, companionId: string, contentLength: number): string {
  const author = !memory.createdByCompanionId
    ? '[用户记录] '
    : memory.createdByCompanionId === companionId
      ? ''
      : `[${memory.createdByName || 'AI'} 记录] `
  const domain = MEMORY_DOMAINS.has(memory.domain) ? memory.domain : '记忆'
  const tags = memory.tags.length ? ` · ${memory.tags.join('、')}` : ''
  const content = memory.content.slice(0, contentLength)
  return `- ${author}${memory.title || '无标题'}（${domain}${tags}）：${content}\n`
}

export function selectMemoryContext(memories: OwnerMemoryRecord[], input: {
  companionId: string
  userMessage: string
  maxChars?: number
  contentLength?: number
  now?: Date
  random?: () => number
}): { text: string; memoryIds: string[] } {
  const now = input.now ?? new Date()
  const maxChars = input.maxChars ?? 2_000
  const contentLength = input.contentLength ?? 200
  const random = input.random ?? Math.random
  const keywords = extractMemoryKeywords(input.userMessage)
  const scored = memories
    .filter((memory) => isMemoryVisibleTo(memory, input.companionId))
    .map((memory) => {
      const hoursSinceLast = (now.getTime() - memory.lastActivatedAt.getTime()) / 3_600_000
      const fatigue = !memory.pinned && memory.activationCount > 5 && hoursSinceLast < 2 ? 0.7 : 1
      return {
        memory,
        score: calculateMemoryScore(memory, now) * (memory.pinned ? 1 : memoryRelevance(memory, keywords)) * fatigue,
      }
    })
    .toSorted((left, right) => right.score - left.score)
  const heading = '【记忆（系统参考，勿提及此段）】\n'
  let text = heading
  let chars = heading.length
  const memoryIds: string[] = []
  const selected = new Set<string>()
  const mainBudget = Math.floor(maxChars * 0.85)
  const add = (memory: OwnerMemoryRecord, limit: number) => {
    const line = formatMemoryLine(memory, input.companionId, contentLength)
    if (chars + line.length > limit) return false
    text += line
    chars += line.length
    memoryIds.push(memory.id)
    selected.add(memory.id)
    return true
  }
  for (const item of scored.filter((item) => item.memory.pinned)) if (!add(item.memory, mainBudget)) break
  for (const item of scored.filter((item) => !item.memory.pinned)) if (!add(item.memory, mainBudget)) break
  const remaining = scored.filter((item) => !item.memory.pinned && !selected.has(item.memory.id))
  if (remaining.length && maxChars - mainBudget > 50) {
    const pool = remaining.slice(0, 10)
    add(pool[Math.floor(random() * pool.length)]!.memory, maxChars)
  }
  return memoryIds.length ? { text, memoryIds } : { text: '', memoryIds: [] }
}

export function parseAutoMemoryOperations(text: string): { cleanText: string; operations: AutoMemoryOperation[] } {
  const operations: AutoMemoryOperation[] = []
  if (!text) return { cleanText: text, operations }
  const expression = /<mem_(create|update|delete)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/mem_\1\s*>)/gi
  let cleanText = text.replace(expression, (_match, kind: string, attributeText: string, body: string) => {
    const attributes: Record<string, string> = {}
    attributeText.replace(/(\w+)\s*=\s*"([^"]*)"/g, (_attribute, key: string, value: string) => {
      attributes[key] = value
      return ''
    })
    operations.push({
      kind: kind.toLowerCase() as AutoMemoryOperation['kind'],
      category: attributes.category ?? null,
      priority: attributes.priority ?? null,
      id: attributes.id ?? null,
      content: String(body || '').trim(),
    })
    return ''
  }).replace(/\n{3,}/g, '\n\n')
  const unfinished = cleanText.toLowerCase().lastIndexOf('<mem_')
  if (unfinished !== -1) {
    const tail = cleanText.slice(unfinished)
    if (tail.length < 900 && !/<\/mem_(create|update|delete)\s*>/i.test(tail) && !/^<mem_delete\b[^>]*\/>/i.test(tail)) {
      cleanText = cleanText.slice(0, unfinished).replace(/\s+$/, '')
    }
  }
  return { cleanText, operations }
}

export function buildAutoMemoryTail(entries: AutoMemoryRecord[], input: {
  queryText: string
  mode: 'retrieval' | 'hybrid' | 'full'
  budget: number
}): string {
  const heading = `【记忆档案（共 ${entries.length} 条，勿向对方复述此段）】`
  if (!entries.length) return `${heading}\n（目前为空）`
  const budget = Math.max(300, input.budget || 1_200)
  const keywords = extractMemoryKeywords(input.queryText)
  const recent = (left: AutoMemoryRecord, right: AutoMemoryRecord) => right.updatedAt.getTime() - left.updatedAt.getTime()
  const score = (entry: AutoMemoryRecord) => keywords.reduce(
    (total, keyword) => total + Number(`${entry.content} ${entry.category}`.toLowerCase().includes(keyword.toLowerCase())),
    0,
  )
  const always = entries.filter((entry) => entry.priority === 'always').toSorted(recent).slice(0, 3)
  const rest = entries.filter((entry) => entry.priority !== 'always')
  const selected = input.mode === 'retrieval'
    ? entries.map((entry) => ({ entry, score: score(entry) })).filter((item) => item.score > 0).toSorted((left, right) => right.score - left.score || recent(left.entry, right.entry)).map((item) => item.entry)
    : input.mode === 'full'
      ? [...always, ...rest.toSorted((left, right) => ({ always: 0, normal: 1, low: 2 }[left.priority] - { always: 0, normal: 1, low: 2 }[right.priority]) || recent(left, right))]
      : [...always, ...rest.map((entry) => ({ entry, score: score(entry) })).filter((item) => item.score > 0).toSorted((left, right) => right.score - left.score || recent(left.entry, right.entry)).map((item) => item.entry)]
  let output = heading
  for (const entry of selected) {
    const line = `\n[${entry.category}] (id:${entry.id}) ${entry.content}`
    if (output.length + line.length > budget) break
    output += line
  }
  return output
}
