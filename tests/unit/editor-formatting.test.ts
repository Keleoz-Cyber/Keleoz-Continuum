import { describe, expect, it } from 'vitest'

import {
  canApplyEditorLink,
  editorTextSelectionRange,
  normalizeEditorLink,
} from '@/modules/editor/formatting'

describe('editor formatting contracts', () => {
  it('normalizes ordinary web links and preserves safe internal targets', () => {
    expect(normalizeEditorLink('example.com/path')).toBe('https://example.com/path')
    expect(normalizeEditorLink('https://example.com/path')).toBe('https://example.com/path')
    expect(normalizeEditorLink('/projects/continuum')).toBe('/projects/continuum')
    expect(normalizeEditorLink('#first-light')).toBe('#first-light')
    expect(normalizeEditorLink('mailto:hello@example.com')).toBe('mailto:hello@example.com')
  })

  it('rejects executable, protocol-relative, credentialed, and empty links', () => {
    expect(normalizeEditorLink('javascript:alert(1)')).toBeNull()
    expect(normalizeEditorLink('//evil.example/path')).toBeNull()
    expect(normalizeEditorLink('https://user:secret@example.com')).toBeNull()
    expect(normalizeEditorLink('   ')).toBeNull()
  })

  it('retains only a non-collapsed text selection for delayed link actions', () => {
    expect(editorTextSelectionRange({ from: 4, to: 19 })).toEqual({ from: 4, to: 19 })
    expect(editorTextSelectionRange({ from: 4, to: 4 })).toBeNull()
    expect(editorTextSelectionRange({ from: 8, to: 3 })).toBeNull()
  })

  it('does not offer Link for an inline-code selection', () => {
    const selection = { from: 4, to: 19 }
    expect(canApplyEditorLink('/projects/continuum', selection, false)).toBe(true)
    expect(canApplyEditorLink('/projects/continuum', selection, true)).toBe(false)
    expect(canApplyEditorLink('/projects/continuum', null, false)).toBe(false)
    expect(canApplyEditorLink(null, selection, false)).toBe(false)
  })
})
