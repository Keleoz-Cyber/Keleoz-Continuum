'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireOwner } from '@/modules/auth/dal'
import { ownerKnowledgeRepository } from '@/modules/owner-memory/runtime'

const uuid = z.uuid()
const text = (value: FormDataEntryValue | null, maximum = 8_000) => z.string().trim().max(maximum).parse(value ?? '')
const tags = (value: FormDataEntryValue | null) => text(value, 1_000).split(/[,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 24)
const number = (value: FormDataEntryValue | null, minimum: number, maximum: number, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback
}

export async function createCompanionAction(formData: FormData) {
  await requireOwner()
  const companion = await ownerKnowledgeRepository.createCompanion({
    name: z.string().trim().min(1).max(120).parse(formData.get('name')),
    description: text(formData.get('description'), 2_000),
    systemPrompt: z.string().trim().min(1).max(8_000).parse(formData.get('systemPrompt')),
    memoryEnabled: formData.get('memoryEnabled') === 'on',
    autoMemoryEnabled: formData.get('autoMemoryEnabled') === 'on',
  })
  revalidatePath('/studio/chat')
  revalidatePath('/studio/memory')
  redirect(`/studio/chat?companion=${companion.id}`)
}

export async function updateCompanionAction(formData: FormData) {
  await requireOwner()
  await ownerKnowledgeRepository.updateCompanion({
    id: uuid.parse(formData.get('id')),
    name: z.string().trim().min(1).max(120).parse(formData.get('name')),
    description: text(formData.get('description'), 2_000),
    systemPrompt: z.string().trim().min(1).max(8_000).parse(formData.get('systemPrompt')),
    memoryEnabled: formData.get('memoryEnabled') === 'on',
    autoMemoryEnabled: formData.get('autoMemoryEnabled') === 'on',
  })
  revalidatePath('/studio/chat')
  revalidatePath('/studio/memory')
}

export async function createThreadAction(formData: FormData) {
  await requireOwner()
  const thread = await ownerKnowledgeRepository.createThread({
    companionId: uuid.parse(formData.get('companionId')),
    title: text(formData.get('title'), 160),
  })
  revalidatePath('/studio/chat')
  redirect(`/studio/chat?thread=${thread.id}`)
}

export async function createMemoryAction(formData: FormData) {
  await requireOwner()
  await ownerKnowledgeRepository.createMemory({
    title: z.string().trim().min(1).max(240).parse(formData.get('title')),
    summary: text(formData.get('summary'), 2_000),
    content: z.string().trim().min(1).max(12_000).parse(formData.get('content')),
    oneLine: text(formData.get('oneLine'), 500),
    domain: text(formData.get('domain'), 80) || '日常',
    tags: tags(formData.get('tags')),
    valence: number(formData.get('valence'), 0, 1, 0.5),
    arousal: number(formData.get('arousal'), 0, 1, 0.3),
    importance: Math.round(number(formData.get('importance'), 1, 10, 5)),
    pinned: formData.get('pinned') === 'on', resolved: formData.get('resolved') === 'on',
    visibility: z.enum(['public', 'only', 'except', 'private']).parse(formData.get('visibility') ?? 'public'),
    visibleTo: formData.getAll('visibleTo').flatMap((value) => uuid.safeParse(value).success ? [String(value)] : []),
    excludeFrom: formData.getAll('excludeFrom').flatMap((value) => uuid.safeParse(value).success ? [String(value)] : []),
  })
  revalidatePath('/studio/memory')
}

export async function updateMemoryAction(formData: FormData) {
  await requireOwner()
  const id = uuid.parse(formData.get('id'))
  const existing = await ownerKnowledgeRepository.getMemory(id)
  if (!existing) return
  await ownerKnowledgeRepository.updateMemory({
    ...existing,
    title: z.string().trim().min(1).max(240).parse(formData.get('title')),
    summary: text(formData.get('summary'), 2_000),
    content: z.string().trim().min(1).max(12_000).parse(formData.get('content')),
    oneLine: text(formData.get('oneLine'), 500),
    domain: text(formData.get('domain'), 80) || '日常',
    tags: tags(formData.get('tags')),
    valence: number(formData.get('valence'), 0, 1, existing.valence),
    arousal: number(formData.get('arousal'), 0, 1, existing.arousal),
    importance: Math.round(number(formData.get('importance'), 1, 10, existing.importance)),
    pinned: formData.get('pinned') === 'on', resolved: formData.get('resolved') === 'on',
    visibility: z.enum(['public', 'only', 'except', 'private']).parse(formData.get('visibility') ?? existing.visibility),
    visibleTo: formData.getAll('visibleTo').flatMap((value) => uuid.safeParse(value).success ? [String(value)] : []),
    excludeFrom: formData.getAll('excludeFrom').flatMap((value) => uuid.safeParse(value).success ? [String(value)] : []),
  })
  revalidatePath('/studio/memory')
}

export async function deleteMemoryAction(formData: FormData) {
  await requireOwner()
  await ownerKnowledgeRepository.deleteMemory(uuid.parse(formData.get('id')))
  revalidatePath('/studio/memory')
}

export async function updateAutoMemoryAction(formData: FormData) {
  await requireOwner()
  await ownerKnowledgeRepository.updateAutoMemory({
    id: uuid.parse(formData.get('id')),
    companionId: uuid.parse(formData.get('companionId')),
    content: z.string().trim().min(1).max(600).parse(formData.get('content')),
    priority: z.enum(['always', 'normal', 'low']).parse(formData.get('priority')),
    archived: formData.get('archived') === 'on',
  })
  revalidatePath('/studio/memory')
}

export async function deleteAutoMemoryAction(formData: FormData) {
  await requireOwner()
  await ownerKnowledgeRepository.deleteAutoMemory(uuid.parse(formData.get('id')), uuid.parse(formData.get('companionId')))
  revalidatePath('/studio/memory')
}
