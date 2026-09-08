// Adapt the Mobile source's thin, rounded blue-glass track; no claimed byte percentage.
export const loadingFeedbackCss = `
.continuum-loading-track{position:relative;width:min(300px,72vw);height:6px;box-sizing:border-box;overflow:hidden;border-radius:999px;border:1px solid rgba(202,216,236,.4);background:linear-gradient(180deg,rgba(214,226,243,.13),rgba(70,86,111,.09));box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 5px 18px rgba(0,0,0,.12);isolation:isolate}
.continuum-loading-track>span{display:block;width:38%;height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(105,153,202,.5),rgba(139,182,222,.85),rgba(190,217,243,.95));box-shadow:0 0 14px rgba(101,154,207,.22);animation:continuum-loading-flow 2.2s ease-in-out infinite;will-change:transform}
@keyframes continuum-loading-flow{0%{transform:translateX(-105%)}100%{transform:translateX(365%)}}
@media(prefers-reduced-motion:reduce){.continuum-loading-track>span{animation:none;transform:translateX(80%);will-change:auto}}
`

// Public Home only: the parent owns loading; source scenes and raw documents stay intact.
export function delegateSourceLoading(html: string, mobile = false): string {
  if (html.includes('id="continuum-loading-feedback-style"')) return html
  if (mobile) {
    // Retain the native cleanup, but don't run an invisible minimum-duration animation.
    const start = /raf=requestAnimationFrame\(frame\);(?=\r?\n\}catch\(e\)\{try\{var bad=document.getElementById\('ib-splash'\))/
    if (!start.test(html)) throw new Error('Mobile splash startup boundary missing')
    html = html.replace(start, "addEventListener('continuum:home-ready',cleanup,{once:true});clearAll();")
  }
  const selector = mobile ? '#ib-splash' : '#preloader'
  return html.replace('</head>', `<style id="continuum-loading-feedback-style">${selector}{visibility:hidden!important;pointer-events:none!important}</style></head>`)
}
