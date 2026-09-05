import { getCurrentOwner } from '@/modules/auth/dal'
import { sourceWrite } from '@/modules/source-native/contracts'
import { deleteSourceRecord, readSourceRecords, writeSourceRecord } from '@/modules/source-native/repository'
import { hasAllowedOrigin } from '@/shared/same-origin'
import { serverEnv } from '@/shared/env'

export async function GET() {
  if (!await getCurrentOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  return Response.json(await readSourceRecords(), { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  if (!await getCurrentOwner()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  if (!hasAllowedOrigin(request, serverEnv.SITE_ORIGIN)) return Response.json({ error: 'invalid_origin' }, { status: 403 })
  const raw = await request.text()
  if (raw.length > 16_000_000) return Response.json({ error: 'too_large' }, { status: 413 })
  let json: unknown
  try { json = JSON.parse(raw) } catch { return Response.json({ error: 'invalid_json' }, { status: 400 }) }
  const parsed = sourceWrite.safeParse(json)
  if (!parsed.success) return Response.json({ error: 'invalid_record' }, { status: 400 })
  const { op, store, key, value } = parsed.data
  if (op === 'delete') { await deleteSourceRecord(store, key); return Response.json({ ok: true }) }
  if (!value) return Response.json({ error: 'missing_value' }, { status: 400 })
  return Response.json(await writeSourceRecord(store, key, value), { headers: { 'Cache-Control': 'private, no-store' } })
}
