// Adapt the Mobile source's thin, rounded blue-glass track; no claimed byte percentage.
export const loadingFeedbackCss = `
.continuum-loading-track{position:relative;width:min(300px,72vw);height:6px;box-sizing:border-box;overflow:hidden;border-radius:999px;border:1px solid rgba(202,216,236,.4);background:linear-gradient(180deg,rgba(214,226,243,.13),rgba(70,86,111,.09));box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 5px 18px rgba(0,0,0,.12);isolation:isolate}
.continuum-loading-track>span{display:block;width:38%;height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(105,153,202,.5),rgba(139,182,222,.85),rgba(190,217,243,.95));box-shadow:0 0 14px rgba(101,154,207,.22);animation:continuum-loading-flow 2.2s ease-in-out infinite;will-change:transform}
@keyframes continuum-loading-flow{0%{transform:translateX(-105%)}100%{transform:translateX(365%)}}
@media(prefers-reduced-motion:reduce){.continuum-loading-track>span{animation:none;transform:translateX(80%);will-change:auto}}
`

export function addDesktopLoadingFeedback(html: string): string {
  const marker = '<p class="preloader-sub">preparing your space</p>'
  if (!html.includes(marker) || html.includes('id="continuum-loading-feedback-style"')) return html
  return html.replace('</head>', `<style id="continuum-loading-feedback-style">${loadingFeedbackCss}</style></head>`)
    .replace(marker, '<div class="continuum-loading-track" role="progressbar" aria-label="首页正在加载" aria-valuetext="正在准备资源与画面"><span></span></div>' + marker)
}
