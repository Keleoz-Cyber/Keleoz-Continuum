'use client'

import { useActionState } from 'react'

import {
  archiveContentAction,
  deleteArchivedContentAction,
  restoreArchivedContentAction,
  type DeleteContentState,
} from '@/modules/content/actions'

const initialDeleteState: DeleteContentState = { error: null }

export function StudioContentControls(props: {
  entryId: string
  title: string
  status: 'draft' | 'published' | 'archived'
  isPublic: boolean
}) {
  const [deleteState, deleteAction, deletePending] = useActionState(deleteArchivedContentAction, initialDeleteState)

  if (props.status !== 'archived') {
    return (
      <form action={archiveContentAction} className="studio-lifecycle-form">
        <input name="entryId" type="hidden" value={props.entryId} />
        <button type="submit">{props.isPublic ? 'Archive & withdraw' : 'Archive'}</button>
      </form>
    )
  }

  return (
    <div className="studio-lifecycle-archived">
      <form action={restoreArchivedContentAction} className="studio-lifecycle-form">
        <input name="entryId" type="hidden" value={props.entryId} />
        <button type="submit">Restore to drafts</button>
      </form>
      <details>
        <summary>Permanent delete</summary>
        <form action={deleteAction} className="studio-delete-form">
          <input name="entryId" type="hidden" value={props.entryId} />
          <p>删除 “{props.title}” 及其全部版本。媒体库原件不会删除。</p>
          <label><span>Owner password</span><input name="password" type="password" required maxLength={256} autoComplete="current-password" /></label>
          <button type="submit" disabled={deletePending}>{deletePending ? 'Deleting…' : 'Delete permanently'}</button>
          {deleteState.error ? <p role="alert">{deleteState.error}</p> : null}
        </form>
      </details>
    </div>
  )
}
