import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import { apiFetch, parseJsonResponse } from '../utils/fetchApi'
import { HiOutlineTrash } from '../icons'
import { getEditingDocumentId, clearSensitiveClientData } from '../utils/wizardStorage'

async function fetchMyDocuments() {
  const res = await apiFetch('/api/my-documents', { credentials: 'include' })
  const data = await parseJsonResponse(res)
  if (!res.ok) throw new Error(data.error || 'Failed to load documents')
  return data
}

function statusBadge(status) {
  const styles = {
    draft:    'bg-surface-muted text-ink-secondary',
    sent:     'bg-accent-muted text-accent dark:bg-accent/20',
    executed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  )
}

export default function MyDocuments() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-documents'],
    queryFn: fetchMyDocuments,
    refetchOnMount: 'always',
  })
  const [confirmId, setConfirmId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const documents = data?.documents ?? []

  const handleDelete = async (documentId) => {
    setDeletingId(documentId)
    setDeleteError(null)
    try {
      const res = await apiFetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        documentId,
        credentials: 'include',
      })
      const json = await parseJsonResponse(res)
      if (!res.ok) throw new Error(json.error || 'Could not delete lease')
      if (getEditingDocumentId() === documentId) clearSensitiveClientData()
      setConfirmId(null)
      await queryClient.invalidateQueries({ queryKey: ['my-documents'] })
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageMeta title="My Documents — Docu Create" />

      <div className="page-shell">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-heading">My Documents</h1>
            <Link
              to="/"
              className="text-sm font-semibold bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors"
            >
              + New Lease
            </Link>
          </div>

          {deleteError && (
            <p className="alert-error text-sm mb-4">{deleteError}</p>
          )}

          {isLoading && (
            <p className="text-muted text-base">Loading your documents…</p>
          )}

          {isError && (
            <p className="text-ember-600 text-base">Could not load documents. Please try again.</p>
          )}

          {!isLoading && !isError && documents.length === 0 && (
            <div className="text-center py-16 text-muted">
              <p className="text-lg mb-2">No documents yet.</p>
              <p className="text-sm mb-6">Create your first lease to get started.</p>
              <Link
                to="/"
                className="text-sm font-semibold bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg transition-colors"
              >
                Create a Lease
              </Link>
            </div>
          )}

          {documents.length > 0 && (
            <div className="divide-y divide-line dark:divide-line-dark border border-line dark:border-line-dark rounded-xl overflow-hidden">
              {documents.map(doc => (
                <div
                  key={doc.document_id}
                  className="flex items-center justify-between gap-4 px-5 py-4 bg-surface dark:bg-surface-elevated hover:bg-surface-muted dark:hover:bg-surface-input transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-heading truncate">
                      {doc.title || doc.document_id}
                    </p>
                    <p className="text-sm text-muted mt-0.5">
                      {doc.lease_type && <span className="capitalize">{doc.lease_type.replace('-', ' ')} · </span>}
                      {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {confirmId === doc.document_id && (
                      <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                        Delete this lease permanently? Signing links already sent will stop working.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(doc.status)}
                    <Link
                      to={`/preview/${doc.document_id}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Open →
                    </Link>
                    {confirmId === doc.document_id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.document_id)}
                          disabled={deletingId === doc.document_id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-md text-xs font-medium"
                        >
                          {deletingId === doc.document_id ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          disabled={Boolean(deletingId)}
                          className="px-3 py-1.5 btn-secondary text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setConfirmId(doc.document_id); setDeleteError(null) }}
                        className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline inline-flex items-center gap-1"
                        aria-label={`Delete ${doc.title || 'lease'}`}
                      >
                        <HiOutlineTrash className="w-4 h-4" aria-hidden="true" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
