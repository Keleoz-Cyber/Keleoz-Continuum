import { z } from 'zod'

const base = z.object({
  version:z.literal(1), title:z.string().min(1).max(240), subtitle:z.string().max(320),
  content:z.string().min(1).max(120_000), createdAt:z.number().int().min(0).max(8.64e15), updatedAt:z.number().int().min(0).max(8.64e15),
})
const schema = z.discriminatedUnion('type',[
  base.extend({type:z.literal('tea-history'),id:z.string().regex(/^tea-history:tea_\d+$/)}),
  base.extend({type:z.literal('story-history'),id:z.string().regex(/^story-history:post_\d+$/),stage:z.enum(['progress','generating','document','raw'])}),
  base.extend({type:z.literal('tarot-history'),id:z.string().regex(/^tarot-history:tarot_\d+$/)}),
])
export type GuestHistory = z.infer<typeof schema>
export function decodeGuestHistory(value: unknown): GuestHistory | null {
  const parsed=schema.safeParse(value)
  return parsed.success?parsed.data:null
}
export function exportGuestHistory(records: GuestHistory[]): string {
  return JSON.stringify({format:'keleoz-local-history',version:1,records:records.map(decodeGuestHistory).filter(Boolean)},null,2)
}
