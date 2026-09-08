import { localizeSourceFonts } from '@/modules/source-native/fonts'
import { addDesktopLoadingFeedback } from './loading-feedback'

export function adaptDesktopSourceForPublicHome(html: string) {
  html = addDesktopLoadingFeedback(localizeSourceFonts(html))
  const head = '<head>'
  const index = html.indexOf(head)
  if (index < 0) throw new Error('Desktop source is missing its <head> boundary')
  if (html.includes('__continuumSourceGlossFallback')) return html

  const bootstrap = `<script id="continuum-source-gloss-bootstrap">
(function(){
  var proto=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
  if(!proto||proto.__continuumSourceGlossFallback)return;
  Object.defineProperty(proto,'__continuumSourceGlossFallback',{value:true});
  proto.getImageData=function(){
    throw new DOMException('Use source gloss fallback','SecurityError');
  };
})();
</script>`

  return `${html.slice(0, index + head.length)}${bootstrap}${html.slice(index + head.length)}`
}
