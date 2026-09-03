const internalPathPattern = /^\/(?!\/)[^\s\\]*$/
const fragmentPattern = /^#[a-zA-Z0-9][a-zA-Z0-9_-]*$/
const bareDomainPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:[/?#][^\s]*)?$/

export type EditorTextSelectionRange = { from: number; to: number }

export function editorTextSelectionRange(selection: EditorTextSelectionRange): EditorTextSelectionRange | null {
  if (!Number.isInteger(selection.from) || !Number.isInteger(selection.to)) return null
  if (selection.from < 0 || selection.to <= selection.from) return null
  return { from: selection.from, to: selection.to }
}

export function canApplyEditorLink(
  href: string | null,
  selection: EditorTextSelectionRange | null,
  hasInlineCode: boolean,
) {
  return Boolean(href && selection && !hasInlineCode)
}

export function normalizeEditorLink(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  if (internalPathPattern.test(value) || fragmentPattern.test(value)) return value
  const candidate = bareDomainPattern.test(value) ? `https://${value}` : value
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  if (url.username || url.password) return null
  if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'mailto:') return null
  return url.toString()
}
