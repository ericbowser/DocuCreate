import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PDFDownloadLink } from '@react-pdf/renderer'
import LeaseDocument from '../components/LeaseDocument'
import LeaseAgreementView from '../components/LeaseAgreementView'
import { apiUrl, parseJsonResponse } from '../utils/fetchApi'
import { hydrateWizardFromLease, clearWizardDraft, getEditingDocumentId } from '../utils/wizardStorage'
import {
  HiArrowDownTray,
  HiOutlineEnvelope,
  HiOutlinePrinter,
  HiOutlineTrash,
  HiLockClosed,
  HiCheck,
} from '../icons'

export default function Preview() {
  const { documentId }  = useParams()
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const location        = useLocation()
  const recreated       = location.state?.recreated === true

  const [leaseData,   setLeaseData]   = useState(null)
  const [paid,        setPaid]        = useState(false)
  const [paymentBypassed, setPaymentBypassed] = useState(false)
  const [price,       setPrice]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(null)
  const [paying,      setPaying]      = useState(false)
  const [payError,    setPayError]    = useState(null)
  const [sending,     setSending]     = useState(false)
  const [sent,        setSent]        = useState(false)
  const [sendError,   setSendError]   = useState(null)
  const [signToken,   setSignToken]   = useState(null)
  const [editing,     setEditing]     = useState(false)
  const [editError,   setEditError]   = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res  = await fetch(apiUrl(`/api/documents/${documentId}`))
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Document not found')
      setLeaseData(data.leaseData)
      setPaid(data.paid)
      setPaymentBypassed(data.paymentBypassed ?? false)
      setPrice(data.price)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  // Verify Stripe return
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!documentId || !sessionId) return

    ;(async () => {
      try {
        const res = await fetch(apiUrl(`/api/documents/${documentId}/verify-payment`), {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ sessionId }),
        })
        const data = await parseJsonResponse(res)
        if (data.paid && data.leaseData) {
          setPaid(true)
          setLeaseData(data.leaseData)
          window.history.replaceState({}, '', `/preview/${documentId}`)
        }
      } catch {
        // fetchDocument will reflect current state
      }
    })()
  }, [documentId, searchParams])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  const handlePay = async () => {
    setPaying(true)
    setPayError(null)
    try {
      const res  = await fetch(apiUrl('/api/stripe/create-checkout-session'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId }),
      })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.bypassed) {
        setPaid(true)
        await fetchDocument()
        return
      }
      window.location.href = data.url
    } catch (err) {
      setPayError(err.message)
    } finally {
      setPaying(false)
    }
  }

  const handleEdit = async () => {
    if (!documentId) return
    setEditing(true)
    setEditError(null)
    try {
      let data = leaseData
      if (!data || data._preview) {
        const res = await fetch(apiUrl(`/api/documents/${documentId}/edit`))
        const json = await parseJsonResponse(res)
        if (!res.ok) throw new Error(json.error || 'Could not load lease for editing')
        data = json.leaseData
      }
      hydrateWizardFromLease(data, documentId)
      navigate('/')
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!documentId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(apiUrl(`/api/documents/${documentId}`), { method: 'DELETE' })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Could not delete lease')
      if (getEditingDocumentId() === documentId) clearWizardDraft()
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSend = async () => {
    if (!paid) return
    setSending(true)
    setSendError(null)
    try {
      const res  = await fetch(apiUrl('/api/lease/send'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId }),
      })
      const data = await parseJsonResponse(res)
      if (data.success) { setSent(true); setSignToken(data.token) }
      else setSendError(data.error || 'Failed to send.')
    } catch {
      setSendError('Could not reach the server. Is it running?')
    } finally {
      setSending(false)
    }
  }

  if (!documentId) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">No document selected. Complete the wizard to generate a lease.</p>
          <button onClick={() => navigate('/')} className="text-ember-400 hover:text-ember-300 underline font-medium">
            Go to wizard
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <p className="text-muted">Loading your lease…</p>
      </div>
    )
  }

  if (loadError || !leaseData) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">{loadError || 'Document not found'}</p>
          <button onClick={() => navigate('/')} className="text-ember-400 hover:text-ember-300 underline font-medium">
            Go back to wizard
          </button>
        </div>
      </div>
    )
  }

  const tenantSlug = leaseData.tenantName?.replace(/\s+/g, '_') ?? 'document'
  const paymentCancelled = searchParams.get('payment') === 'cancelled'

  return (
    <div className="page-shell preview-page">
      <div className="max-w-6xl mx-auto">

        <header className="preview-toolbar no-print">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-heading">Lease Preview</h1>
              <p className="text-muted text-sm mt-0.5">
                {paid ? (
                  <>{leaseData.tenantName} · {leaseData.propertyAddress}</>
                ) : paymentBypassed ? (
                  <>Full document — free during launch</>
                ) : (
                  <>Preview only — pay to unlock download &amp; print</>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEdit}
                disabled={editing || deleting}
                className="btn-secondary"
              >
                {editing ? 'Loading…' : '← Edit'}
              </button>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(true); setDeleteError(null) }}
                  disabled={deleting}
                  className="px-4 py-2 border border-red-300 dark:border-red-800/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <HiOutlineTrash className="w-4 h-4" aria-hidden="true" />
                  Delete
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20">
                  <span className="text-sm text-red-800 dark:text-red-200">Delete this lease permanently?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-md text-sm font-medium"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-3 py-1.5 btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {paid ? (
                <>
                  <PDFDownloadLink
                    document={<LeaseDocument data={leaseData} />}
                    fileName={`lease_${tenantSlug}.pdf`}
                    className="btn-primary"
                  >
                    {({ loading: pdfLoading }) => pdfLoading ? 'Preparing…' : (
                      <span className="inline-flex items-center gap-1.5">
                        <HiArrowDownTray className="w-4 h-4" aria-hidden="true" /> Download PDF
                      </span>
                    )}
                  </PDFDownloadLink>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-secondary"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <HiOutlinePrinter className="w-4 h-4" aria-hidden="true" /> Print
                    </span>
                  </button>
                  {!sent ? (
                    <button onClick={handleSend} disabled={sending}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-500/60 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                      {sending
                        ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</>
                        : <><HiOutlineEnvelope className="w-4 h-4" aria-hidden="true" /> Send for E-Signature</>}
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-green-950/50 border border-green-600 rounded-lg text-sm text-green-200 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <HiCheck className="w-4 h-4" aria-hidden="true" /> Sent to {leaseData.tenantEmail}
                      </span>
                    </span>
                  )}
                </>
              ) : !paymentBypassed && (
                <button onClick={handlePay} disabled={paying}
                  className="px-5 py-2 bg-ember-600 hover:bg-ember-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors">
                  {paying ? 'Redirecting…' : (
                    <span className="inline-flex items-center gap-1.5">
                      <HiLockClosed className="w-4 h-4" aria-hidden="true" /> Pay {price ?? ''} to Unlock
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {recreated && (
          <div className="info-panel no-print mb-4 text-sm">
            Your previous document was no longer on the server, so a new copy was saved. Payment status was not transferred — unlock again if needed.
          </div>
        )}
        {paymentCancelled && !paid && (
          <div className="alert-error no-print mb-4">Payment was cancelled. Your preview is still saved.</div>
        )}
        {editError && <div className="alert-error no-print mb-4">{editError}</div>}
        {deleteError && <div className="alert-error no-print mb-4">{deleteError}</div>}
        {showDeleteConfirm && sent && (
          <div className="warn-panel no-print mb-4 text-sm">
            This lease was sent for e-signature. Deleting removes the stored document; any signing link already emailed may no longer match an active record.
          </div>
        )}
        {payError && <div className="alert-error no-print mb-4">{payError}</div>}
        {sendError && <div className="alert-error no-print mb-4">{sendError}</div>}
        {sent && (
          <div className="alert-success no-print mb-4">
            <span className="inline-flex items-center gap-1.5">
              <HiCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Signing request sent to <strong>{leaseData.tenantEmail}</strong>.</span>
            </span>
            {signToken && (
              <span className="block mt-1 text-xs opacity-90">
                Signing link:{' '}
                <code className="bg-black/30 px-1.5 py-0.5 rounded text-white">
                  {window.location.origin}/sign/{signToken}
                </code>
              </span>
            )}
          </div>
        )}

        {paymentBypassed && (
          <div className="info-panel no-print mb-5 text-sm">
            Downloads, printing, and e-signature are free while payments are not enabled. No Stripe account required.
          </div>
        )}
        {!paid && !paymentBypassed && (
          <div className="payment-banner no-print mb-5">
            <p className="text-sm text-white font-medium">
              Your lease is ready. Pay {price} once to unlock the full document, PDF download, printing, and e-signature.
            </p>
          </div>
        )}

        <LeaseAgreementView data={leaseData} locked={!paid} />
      </div>
    </div>
  )
}
