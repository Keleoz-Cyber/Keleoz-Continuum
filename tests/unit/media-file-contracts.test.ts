import { describe, expect, it } from 'vitest'

import {
  buildOriginalStorageKey,
  contentDispositionForMedia,
  inspectGenericUpload,
  safeDownloadName,
} from '@/modules/media/contracts'

const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVEfmt '), Buffer.alloc(32)])
const mp4 = Buffer.from([0, 0, 0, 24, ...Buffer.from('ftypisom'), 0, 0, 2, 0, ...Buffer.from('isomiso2')])

describe('non-image media contracts', () => {
  it('derives audio, video, PDF, and UTF-8 text kinds from bytes', async () => {
    await expect(inspectGenericUpload({ bytes: wav, originalName: 'sound.wav', declaredMimeType: 'application/octet-stream' }))
      .resolves.toMatchObject({ kind: 'audio', mimeType: 'audio/wav', extension: 'wav' })
    await expect(inspectGenericUpload({ bytes: mp4, originalName: 'clip.mp4', declaredMimeType: 'text/plain' }))
      .resolves.toMatchObject({ kind: 'video', mimeType: 'video/mp4', extension: 'mp4' })
    await expect(inspectGenericUpload({ bytes: Buffer.from('%PDF-1.7\n%%EOF'), originalName: 'notes.pdf', declaredMimeType: '' }))
      .resolves.toMatchObject({ kind: 'attachment', mimeType: 'application/pdf', extension: 'pdf' })
    await expect(inspectGenericUpload({ bytes: Buffer.from('plain UTF-8 文本'), originalName: '../notes.md', declaredMimeType: '' }))
      .resolves.toMatchObject({ kind: 'attachment', mimeType: 'text/plain', extension: 'txt', originalName: 'notes.md' })
  })

  it('rejects executable/unknown bytes and enforces tighter V1 video limits', async () => {
    await expect(inspectGenericUpload({ bytes: Buffer.from('MZ\0\0binary'), originalName: 'payload.exe', declaredMimeType: 'application/pdf' }))
      .rejects.toThrow('unsupported')
    await expect(inspectGenericUpload({ bytes: Buffer.concat([mp4, Buffer.alloc(25 * 1024 * 1024)]), originalName: 'large.mp4', declaredMimeType: 'video/mp4' }))
      .rejects.toThrow('25 MB')
  })

  it('builds random original-object paths and header-safe download names', () => {
    expect(buildOriginalStorageKey({
      mediaId: '4415fc7c-9e85-4b17-a791-f21990c98e38', extension: 'pdf', now: new Date('2026-09-01T10:00:00Z'),
    })).toBe('media/2026/09/4415fc7c-9e85-4b17-a791-f21990c98e38/original.pdf')
    expect(safeDownloadName('..\\bad/"report".pdf')).toBe('report.pdf')
    expect(contentDispositionForMedia('audio/wav', 'sound.wav')).toBe('inline')
    expect(contentDispositionForMedia('application/pdf', '拍摄说明.pdf')).toBe("attachment; filename*=UTF-8''%E6%8B%8D%E6%91%84%E8%AF%B4%E6%98%8E.pdf")
  })
})
