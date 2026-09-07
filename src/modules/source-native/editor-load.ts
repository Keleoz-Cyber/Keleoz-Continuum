export function lockEditorMarkup(html:string){
  return html.replace(/<(?:input|textarea|select)\b[^>]*\bid=["'](?:m-)?ed-(?:title|subtitle|content|cat|format)["'][^>]*>/g,tag=>tag.replace(/>$/,' disabled data-continuum-load-lock>'))
}
