import { z } from 'zod'

const ratio=z.number().min(.7).max(1.5).optional()
const tone=z.enum(['','dark','light','gray']).optional()
const color=z.string().regex(/^#[0-9a-f]{6}$/i).optional()
// Only presentation fields cross the public boundary. Never publish mobilePrefs
// wholesale: it also contains private companions, permissions and service data.
export const visualUiSchema=z.object({
  fs:ratio,chatFs:ratio,uiScale:ratio,szTop:ratio,szDock:ratio,szBrv:ratio,szCvh:ratio,szCvi:ratio,
  panelAlpha:z.number().min(10).max(200).optional(),scrimAlpha:z.number().min(0).max(200).optional(),
  blurPx:z.number().min(0).max(60).optional(),bgBlur:z.number().min(0).max(30).optional(),
  accColor:color,scrimColor:color,glassBase:z.enum(['','b','w']).optional(),txColor:tone,txShadow:z.boolean().optional(),
  tone:z.enum(['','light','gray','dark','wall']).optional(),
  zcNav:tone,zcDesk:tone,zcIcon:tone,zcBlog:tone,zcChat:tone,
  icoStyle:z.enum(['','glass','brick','frost','ink']).optional(),wgStyle:z.enum(['','glass','frost','ink']).optional(),
  bubStyle:z.enum(['','glass','frostw','frostb','gray']).optional(),bubTx:tone,
  wgMusic:z.enum(['','half','mini']).optional(),wgNotes:z.enum(['','full','low']).optional(),wgSched:z.enum(['','full','low']).optional(),
  wgClock:z.enum(['','half','full','low']).optional(),wgClockSt:z.enum(['','glass']).optional(),
  heroSt:z.enum(['','ios','card']).optional(),deskLayout:z.enum(['','classic']).optional(),deskPages:z.number().int().min(1).max(3).optional(),
  bigTouch:z.boolean().optional(),deskMate:z.enum(['','solo','off']).optional(),
})
const key=z.string().regex(/^(?:hero|cal|clock|notes|sched|music|app:[\w-]+|deco:[\w-]+)$/).max(100)
export const appearanceSchema=z.object({
  ui:visualUiSchema.default({}),
  desk:z.object({order:z.array(key).max(80).default([]),hidden:z.array(key).max(80).default([]),pages:z.record(key,z.number().int().min(0).max(6)).default({})}).default({order:[],hidden:[],pages:{}}),
  backgrounds:z.object({site:z.uuid().nullable().default(null)}).default({site:null}),
  desktop:z.object({internal:z.uuid().nullable().default(null),infernal:z.uuid().nullable().default(null),canvas:z.uuid().nullable().default(null),tarot:z.uuid().nullable().default(null),portrait:z.uuid().nullable().default(null)}).default({internal:null,infernal:null,canvas:null,tarot:null,portrait:null}),
  decorations:z.array(z.object({id:z.string().regex(/^[\w-]+$/).max(80),kind:z.enum(['polaroid','pmulti','film','sticker','text','avatar','badge','aurora']),text:z.string().max(24).default(''),size:z.enum(['third','half','full']).default('half'),page:z.number().int().min(1).max(3).default(1),imageIds:z.array(z.uuid()).max(4).default([])})).max(6).default([]),
})
export type Appearance=z.infer<typeof appearanceSchema>
export function appearanceMediaIds(value:Appearance){return [...Object.values(value.backgrounds),...Object.values(value.desktop),...value.decorations.flatMap(item=>item.imageIds)].filter((id):id is string=>!!id)}
export function appearanceProjection(value:Appearance){
  const url=(id:string|null)=>id?`/media/${id}/large.webp`:''
  return {...value,backgrounds:{siteBg:url(value.backgrounds.site),chatBg:''},desktop:Object.fromEntries(Object.entries(value.desktop).map(([k,id])=>[k,url(id)])),decorations:value.decorations.map(({imageIds,...item})=>({...item,imgs:imageIds.map(url),who:'me'}))}
}
