// Adapt only our static bridge scripts, never source documents or user-authored content.
export function adaptSourceNavigation(script:string):string {
  return `function continuumGo(href){if(window.parent.__continuumNavigate&&window.parent.__continuumNavigate(href))return;window.parent.location.href=href;}\n`+
    script.replace(/window\.parent\.location\.href\s*=\s*([^;}]+)/g,'continuumGo($1)')
}
