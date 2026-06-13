import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, parseJsonResponse } from '../utils/fetchApi'
import {
  loadRecentDocuments,
  openDocumentSession,
  rememberRecentDocument,
} from '../utils/wizardStorage'
import { readResumeFile } from '../utils/leaseResume'
import { useAccessPolicy } from '../hooks/useAccessPolicy'
import { HiOutlineInboxArrowDown, HiOutlineKey, HiOutlineHome } from '../icons'

export default function ResumeLease() {
  const navigate = useNavigate()
  const { documentIdOnlyAccess, recoveryPasswordEnabled, loading: policyLoading } = useAccessPolicy()
  const [documentId, setDocumentId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const recent = loadRecentDocuments()

  const goToPreview = (id) => {
    navigate(`/preview/${id}`)
  }

  const handleOpenById = (e) => {
    e.preventDefault()
    const id = documentId.trim()
    if (!id) return
    rememberRecentDocument(id, 'Lease')
    goToPreview(id)
  }

  const handleUnlock = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/documents/unlock', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId: documentId.trim(), password }),
      })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Could not unlock lease')
      openDocumentSession(data.documentId, data.accessToken)
      goToPreview(data.documentId)
    } catch (err) {
      setError(err.message || 'Could not unlock lease')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const parsed = await readResumeFile(file)
      if (parsed.error) throw new Error(parsed.error)

      const res = await apiFetch(`/api/documents/${parsed.documentId}`)
      const data = await parseJsonResponse(res)

      if (!res.ok) {
        if (res.status === 403 && parsed.legacyNoToken) {
          throw new Error(
            'This lease file has no access key in it. On the home page, enter the document ID and your recovery PIN, or open preview in the browser where you created the lease and download the lease file again.',
          )
        }
        throw new Error(data.error || 'Could not open lease')
      }

      if (parsed.accessToken) {
        openDocumentSession(parsed.documentId, parsed.accessToken, parsed.label)
      } else {
        rememberRecentDocument(parsed.documentId, parsed.label || 'Lease')
      }
      goToPreview(parsed.documentId)
    } catch (err) {
      setError(err.message || 'Could not read lease file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-surface p-6 mb-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-heading">Resume a lease</h2>
        <p className="text-sm text-muted mt-1">
          {documentIdOnlyAccess
            ? 'Enter the document ID from your preview URL to open and edit a lease.'
            : 'For landlords only. Use your recovery PIN or a lease file from when you created the lease. Tenants should use the e-signature link from their email.'}
        </p>
      </div>

      <form onSubmit={documentIdOnlyAccess ? handleOpenById : handleUnlock} className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="resume-document-id" className="text-sm font-medium text-body">
            Document ID
          </label>
          <input
            id="resume-document-id"
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="Paste from your preview URL or lease file"
            className="input-field font-mono text-sm"
            autoComplete="off"
          />
          {recent.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {recent.map(({ documentId: id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDocumentId(id)}
                  className="text-xs px-2 py-1 rounded-md border card-border text-muted hover:text-heading"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {recoveryPasswordEnabled && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="resume-password" className="text-sm font-medium text-body">
              Recovery PIN
            </label>
            <input
              id="resume-password"
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Landlord recovery PIN"
              className="input-field"
              autoComplete="off"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading || policyLoading || !documentId.trim() || (recoveryPasswordEnabled && !password)}
          className="btn-primary inline-flex items-center gap-2"
        >
          {documentIdOnlyAccess ? (
            <>
              <HiOutlineHome className="w-4 h-4" aria-hidden="true" />
              {loading ? 'Opening…' : 'Open lease'}
            </>
          ) : (
            <>
              <HiOutlineKey className="w-4 h-4" aria-hidden="true" />
              {loading ? 'Unlocking…' : 'Unlock lease'}
            </>
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-line dark:border-line-dark" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-card dark:bg-surface px-2 text-muted">or</span>
        </div>
      </div>

      <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer w-fit">
        <HiOutlineInboxArrowDown className="w-4 h-4" aria-hidden="true" />
        Open lease file
        <input type="file" accept=".json,.docucreate.json,application/json" className="sr-only" onChange={handleFile} disabled={loading} />
      </label>

      {error && <p className="alert-error text-sm">{error}</p>}
    </div>
  )
}
