'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireOwner } from '@/modules/auth/dal'
import { recordIndependentDownload } from '@/modules/operations/backup-store'
import { getBackupRoot, operationsRepository } from '@/modules/operations/runtime'

export async function setGuestAiEnabledAction(formData: FormData) {
  await requireOwner()
  const enabled = formData.get('enabled')
  if (enabled !== 'true' && enabled !== 'false') redirect('/studio/operations?ai=invalid')
  await operationsRepository.setGuestAiEnabled(enabled === 'true')
  revalidatePath('/studio/operations')
  redirect(`/studio/operations?ai=${enabled === 'true' ? 'resumed' : 'paused'}`)
}

export async function recordIndependentDownloadAction() {
  await requireOwner()
  await recordIndependentDownload(getBackupRoot())
  revalidatePath('/studio/operations')
  redirect('/studio/operations?copy=recorded')
}
