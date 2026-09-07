function divAt(source:string,marker:string) {
  const start=source.indexOf(marker)
  if(start<0)throw new Error('Original editor boundary missing')
  const tags=/<\/?div\b[^>]*>/g;tags.lastIndex=start
  let depth=0,tag:RegExpExecArray|null
  while((tag=tags.exec(source))){depth+=tag[0].startsWith('</')?-1:1;if(depth===0)return source.slice(start,tags.lastIndex)}
  throw new Error('Original editor closing boundary missing')
}
export function originalEditorDocument(source:string,mobile:boolean):string {
  source=localizeSourceFonts(source)
  const head=source.slice(0,source.indexOf('</head>'))
  const staticSource=source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
  const styles=[...staticSource.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(match=>match[0]).join('\n')
  const links=[...head.matchAll(/<link\b[^>]*>/g)].filter(match=>/stylesheet/.test(match[0])).map(match=>match[0]).join('\n')
  let editor=divAt(source,mobile?'<div class="sub" id="sub-blog-editor">':'<div id="blog-edit-view"')
  editor=editor.replace(/onclick="edMd\('([^']+)'\)"/g,'data-source-command="$1"')
    .replace(/onclick="(exitEditor|savePost|edImportPick)\(\)"/g,'data-source-action="$1"')
    .replace(/\son\w+="[^"]*"/g,'')
  if(mobile)editor=editor.replace('class="sub"','class="sub open"')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/reference/${mobile?'internal-beyond-mobile':'internal-beyond'}/">${links}${styles}<style>
  #blog-edit-view{display:block!important}#sub-blog-editor{display:block;transform:none;visibility:visible;opacity:1}.rift-sidebar{overflow-y:auto}.source-block-body{overflow:auto;flex:1}.source-block-body .tiptap{outline:none;min-height:100%;white-space:normal}.source-block-body .tiptap p{margin:0 0 1em}.source-block-body .tiptap pre{white-space:pre-wrap}.source-block-body img,.source-block-body video{max-width:100%;height:auto}.source-block-body audio{max-width:100%}.source-block-body figure{margin:16px 0}.source-block-body .continuum-gallery{display:flex;gap:8px}.source-block-body .continuum-gallery>figure{flex:1;min-width:0}.source-block-body details,.source-block-body aside{border:1px solid rgba(165,198,235,.4);padding:12px;border-radius:8px}.source-editor-tools{font-family:'Noto Sans SC',sans-serif;font-size:12px;color:#41608e}.source-editor-tools details{margin:10px 0}.source-editor-tools summary{cursor:pointer}.source-editor-tools input,.source-editor-tools select{box-sizing:border-box;max-width:100%;padding:7px;margin:4px 0;border:1px solid rgba(165,198,235,.4);border-radius:8px;background:rgba(248,252,255,.6);color:#1e3565}.source-editor-tools button{margin:3px}.source-editor-tools img{max-width:100%;height:auto}.source-editor-tools header{display:none}.source-editor-tools label{display:block}.source-editor-tools .editor-media-list{max-height:280px;overflow:auto}.source-editor-tools .editor-media-list article{padding:8px 0}.source-editor-tools .editor-status{font-size:12px;overflow-wrap:anywhere}.source-block-body ul[data-type=taskList]{list-style:none;padding-left:0}.source-block-body li[data-type=taskItem]{display:flex;gap:8px}.source-block-body li[data-type=taskItem]>div{flex:1}
  .source-block-body .tiptap{white-space:pre-wrap}.source-editor-tools header{display:block}.source-block-body a{color:var(--accent,#41608e)}
  ${mobile?'.source-block-body{min-height:42vh;flex:none}.ed-page{height:auto;min-height:calc(100dvh - 58px - var(--sat));padding-bottom:60px}':'.page{position:relative;z-index:2}#rift-mdbar{display:flex!important}'}
  </style></head><body class="${mobile?'on-sub':''}">${mobile?editor:'<div id="bg-internal-img" class="active bg-blur-active"></div><div id="bg-overlay"></div><div id="page-overlay" class="page-overlay show"></div><div class="page active">'+editor+'</div>'}</body></html>`
}
import { localizeSourceFonts } from '@/modules/source-native/fonts'
