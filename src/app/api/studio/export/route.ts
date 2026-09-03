import { getCurrentOwner } from '@/modules/auth/dal'
import { createPortableExportHttpHandler } from '@/modules/operations/http'
import { operationsRepository } from '@/modules/operations/runtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = createPortableExportHttpHandler({
  getOwner: getCurrentOwner,
  createExport: (input) => operationsRepository.createPortableExport(input),
})
