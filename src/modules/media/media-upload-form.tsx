'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function MediaUploadForm() {
  const router = useRouter()
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  return <form className="studio-media-upload" onSubmit={async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setUploading(true)
    setStatus('Uploading and creating WebP / AVIF variants…')
    try {
      const response = await fetch('/api/studio/media', { method: 'POST', body: new FormData(form) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Upload failed.')
      form.reset()
      setStatus('Media ready.')
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }}>
    <label><span>Image</span><input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" required /></label>
    <label><span>Alt text</span><input name="altText" maxLength={2_000} placeholder="描述画面内容；公开展示时用于可访问性" /></label>
    <button type="submit" disabled={uploading}>{uploading ? 'Processing…' : 'Upload image'}</button>
    <p role="status" aria-live="polite">{status}</p>
  </form>
}
