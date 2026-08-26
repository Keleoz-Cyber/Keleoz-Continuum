'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { DraftSnapshot } from '@/modules/content/schemas'

export type AutosaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'conflict' | 'error'

export function useDraftAutosave(input: {
  entryId: string
  initialRevision: number
  snapshot: DraftSnapshot
  delayMs?: number
}) {
  const [state, setState] = useState<AutosaveState>('idle')
  const [revision, setRevision] = useState(input.initialRevision)
  const revisionRef = useRef(input.initialRevision)
  const [retryNonce, setRetryNonce] = useState(0)
  const payload = JSON.stringify(input.snapshot)
  const lastSavedPayload = useRef(payload)

  useEffect(() => {
    if (payload === lastSavedPayload.current && retryNonce === 0) {
      return
    }

    setState('dirty')
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setState('saving')
      try {
        const response = await fetch(`/api/studio/content/${input.entryId}/draft`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ expectedRevision: revisionRef.current, snapshot: input.snapshot }),
          signal: controller.signal,
        })
        const result = (await response.json()) as {
          revision?: number
          currentRevision?: number
        }
        if (response.status === 409) {
          if (typeof result.currentRevision === 'number') {
            revisionRef.current = result.currentRevision
            setRevision(result.currentRevision)
          }
          setState('conflict')
          return
        }
        if (!response.ok || typeof result.revision !== 'number') {
          setState('error')
          return
        }
        revisionRef.current = result.revision
        setRevision(result.revision)
        lastSavedPayload.current = payload
        setState('saved')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState('error')
      }
    }, input.delayMs ?? 900)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [input.delayMs, input.entryId, input.snapshot, payload, retryNonce])

  useEffect(() => {
    if (!['dirty', 'saving', 'conflict'].includes(state)) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [state])

  const retry = useCallback(() => setRetryNonce((value) => value + 1), [])

  return { state, revision, retry }
}
