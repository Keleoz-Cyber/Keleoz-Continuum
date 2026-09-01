'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function MediaDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  return <div className="studio-media-delete">
    <button type="button" onClick={async () => {
      if (!confirming) { setConfirming(true); return }
      const response = await fetch(`/api/studio/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json() as { error?: string }
        setError(result.error || 'Delete failed.')
        setConfirming(false)
        return
      }
      router.refresh()
    }}>{confirming ? 'Confirm delete' : 'Delete'}</button>
    {confirming ? <button type="button" onClick={() => setConfirming(false)}>Cancel</button> : null}
    {error ? <small>{error}</small> : null}
  </div>
}
