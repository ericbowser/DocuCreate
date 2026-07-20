import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PDFDownloadLink } from '@react-pdf/renderer'
import LeaseDocument from '../components/LeaseDocument'
import LeaseAgreementView from '../components/LeaseAgreementView'
import { apiFetch, parseJsonResponse } from '../utils/fetchApi'
import { hydrateWizardFromLease, clearSensitiveClientData, getEditingDocumentId, getDocumentAccessToken, rememberRecentDocument } from '../utils/wizardStorage'
import { buildResumeBundle, downloadResumeBundle } from '../utils/leaseResume'
import { useAccessPolicy } from '../hooks/useAccessPolicy'
import { validateRecoveryPin } from '../config/recoveryPin'
import PageMeta from '../components/PageMeta'
import {
  HiArrowDownTray,
  HiOutlineEnvelope,
  HiOutlinePrinter,
  HiOutlineTrash,
  HiLockClosed,
  HiCheck,
} from '../icons'

// ── Feature flag ─────────────────────────────────────────────
// Set to true when ready to charge. All payment logic is preserved below.
const PAYMENTS_UI_ENABLED = false

export default function Preview() {
  const { documentIdOnlyAccess, recoveryPasswordEnabled } = useAccessPolicy()
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
  const [resending,   setResending]   = useState(null)
  const [resendNote,  setResendNote]  = useState(null)
  const [tenantToken, setTenantToken] = useState(null)
  const [landlordToken, setLandlordToken] = useState(null)
  const [signing,     setSigning]     = useState(null)
  const [editing,     setEditing]     = useState(false)
  const [editError,   setEditError]   = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [hasRecoveryPassword, setHasRecoveryPassword] = useState(false)
  const [recoveryPw, setRecoveryPw] = useState('')
  const [recoveryPwConfirm, setRecoveryPwConfirm] = useState('')
  const [recoverySaving, setRecoverySaving] = useState(false)
  const [recoveryError, setRecoveryError] = useState(null)
  const [recoverySaved, setRecoverySaved] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res  = await apiFetch(`/api/documents/${documentId}`, { documentId })
      const data = await parseJsonResponse(res)
      if (!res.ok) {
        if (res.status === 403 && data.code === 'ACCESS_TOKEN_REQUIRED') {
          throw new Error(
            documentIdOnlyAccess
              ? 'Could not open this lease. Check the document ID and try again.'
              : 'This preview link is missing its access key. Use “Resume a lease” on the home page with your document ID and PIN, or download a new lease file while preview is open in this browser.',
          )
        }
        throw new Error(data.error || 'Document not found')
      }
      setLeaseData(data.leaseData)
      setPaid(data.paid)
      setPaymentBypassed(data.paymentBypassed ?? false)
      setPrice(data.price)
      setHasRecoveryPassword(Boolean(data.hasRecoveryPassword))
      if (data.leaseData?.tenantName) {
        rememberRecentDocument(documentId, data.leaseData.tenantName)
      }
      if (data.signing) {
        setSigning(data.signing)
        setSent(true)
        setTenantToken(data.signing.tenantToken)
        setLandlordToken(data.signing.landlordToken)
      }

      // Server may return masked lease data when PAYMENTS_ENABLED=true on the API.
      // Auto-unlock when payments are bypassed (free launch mode).
      if (data.leaseData?._preview) {
        try {
          const unlockRes = await apiFetch(`/api/documents/${documentId}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            documentId,
          })
          const unlockData = await parseJsonResponse(unlockRes)
          if (unlockRes.ok && unlockData.paid && unlockData.leaseData) {
            setLeaseData(unlockData.leaseData)
            setPaid(true)
            setPaymentBypassed(Boolean(unlockData.bypassed))
          }
        } catch {
          // leave masked — banner below explains production .env fix
        }
      }
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [documentId, documentIdOnlyAccess])

  // Verify Stripe return
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!documentId || !sessionId) return

    ;(async () => {
      try {
        const res = await apiFetch(`/api/documents/${documentId}/verify-payment`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ sessionId }),
          documentId,
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
      const res  = await apiFetch('/api/stripe/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId }),
        documentId,
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
        const res = await apiFetch(`/api/documents/${documentId}/edit`, { documentId })
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
      const res = await apiFetch(`/api/documents/${documentId}`, { method: 'DELETE', documentId })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Could not delete lease')
      if (getEditingDocumentId() === documentId) clearSensitiveClientData()
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSetRecoveryPassword = async (e) => {
    e.preventDefault()
    if (!documentId) return
    const pinError = validateRecoveryPin(recoveryPw)
    if (pinError) {
      setRecoveryError(pinError)
      return
    }
    if (recoveryPw !== recoveryPwConfirm) {
      setRecoveryError('PINs do not match.')
      return
    }
    setRecoverySaving(true)
    setRecoveryError(null)
    try {
      const res = await apiFetch(`/api/documents/${documentId}/recovery-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: recoveryPw }),
        documentId,
      })
      const data = await parseJsonResponse(res)
      if (!res.ok) throw new Error(data.error || 'Could not save PIN')
      setHasRecoveryPassword(true)
      setRecoverySaved(true)
      setRecoveryPw('')
      setRecoveryPwConfirm('')
    } catch (err) {
      setRecoveryError(err.message)
    } finally {
      setRecoverySaving(false)
    }
  }

  const handleDownloadResume = () => {
    if (!documentId) return
    setDownloadError(null)
    const accessToken = getDocumentAccessToken(documentId)
    if (!accessToken && !documentIdOnlyAccess) {
      setDownloadError(
        'No access key in this browser session. Set a recovery PIN below, or use “Resume a lease” with your document ID and PIN.',
      )
      return
    }
    downloadResumeBundle(
      buildResumeBundle({
        documentId,
        accessToken,
        label: leaseData?.tenantName || leaseData?.landlordName,
      }),
      leaseData?.tenantName || 'lease-resume',
    )
  }

  const handleEndSession = () => {
    clearSensitiveClientData()
    navigate('/', { replace: true })
  }

  const applySigningResponse = (data) => {
    const nextSigning = data.signing || (data.tenantToken ? {
      sent: true,
      status: 'pending',
      tenantSigned: false,
      landlordSigned: false,
      fullyExecuted: false,
      tenantToken: data.tenantToken,
      landlordToken: data.landlordToken,
    } : null)
    if (nextSigning) setSigning(nextSigning)
    if (data.tenantToken || nextSigning?.tenantToken) {
      setTenantToken(data.tenantToken || nextSigning.tenantToken)
    }
    if (data.landlordToken || nextSigning?.landlordToken) {
      setLandlordToken(data.landlordToken || nextSigning.landlordToken)
    }
    setSent(true)
  }

  const handleSend = async () => {
    if (PAYMENTS_UI_ENABLED && !paid) return
    if (leaseData?._preview) {
      setSendError('This lease is still locked. Refresh the page after deploying free-unlock, or set CHARGE_LEASES=false on the server.')
      return
    }
    setSending(true)
    setSendError(null)
    setResendNote(null)
    try {
      const res  = await apiFetch('/api/lease/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId }),
        documentId,
      })
      const data = await parseJsonResponse(res)
      if (data.success) {
        applySigningResponse(data)
      } else if (data.code === 'ALREADY_SENT' && data.signing) {
        applySigningResponse({
          tenantToken: data.signing.tenantToken,
          landlordToken: data.signing.landlordToken,
          signing: data.signing,
        })
        setSendError('This lease was already sent. Use resend below to email the links again.')
      } else if (res.status === 402) {
        setSendError('Payment is still required on the server. Set CHARGE_LEASES=false (or PAYMENT_BYPASS=true), restart the API, then try again.')
      } else {
        setSendError(data.error || 'Failed to send.')
      }
    } catch {
      setSendError('Could not reach the server. Is it running?')
    } finally {
      setSending(false)
    }
  }

  const handleResend = async (party = 'all') => {
    if (PAYMENTS_UI_ENABLED && !paid) return
    setResending(party)
    setSendError(null)
    setResendNote(null)
    try {
      const res = await apiFetch('/api/lease/resend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId, party }),
        documentId,
      })
      const data = await parseJsonResponse(res)
      if (data.success) {
        applySigningResponse(data)
        const emailed = data.emailed || []
        if (emailed.length === 2) {
          setResendNote('Reminder emails sent to tenant and landlord.')
        } else if (emailed.includes('tenant')) {
          setResendNote(`Reminder email sent to ${leaseData.tenantEmail}.`)
        } else if (emailed.includes('landlord')) {
          setResendNote(`Reminder email sent to ${leaseData.landlordEmail}.`)
        }
      } else {
        setSendError(data.error || 'Failed to resend.')
      }
    } catch {
      setSendError('Could not reach the server. Is it running?')
    } finally {
      setResending(null)
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
  const signingActive = sent && signing && !signing.fullyExecuted
  const signingComplete = signing?.fullyExecuted
  // When payment UI is hidden, treat every doc as unlocked for rendering purposes
  const effectivePaid = PAYMENTS_UI_ENABLED ? paid : true

  return (
    <div className="page-shell preview-page">
      <PageMeta title="Lease Preview" noindex privateSession />
      <div className="max-w-6xl mx-auto">

        <header className="preview-toolbar no-print">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-heading">Lease Preview</h1>
              <p className="text-muted text-sm mt-0.5">
                {leaseData.tenantName} · {leaseData.propertyAddress}
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

              <button
                type="button"
                onClick={handleEndSession}
                className="btn-secondary text-sm"
              >
                End session
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

              {effectivePaid ? (
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
                  ) : signingComplete ? (
                    <span className="px-4 py-2 bg-green-950/50 border border-green-600 rounded-lg text-sm text-green-200 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <HiCheck className="w-4 h-4" aria-hidden="true" /> Fully signed
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleResend('all')}
                      disabled={Boolean(resending)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-500/60 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {resending === 'all'
                        ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Resending…</>
                        : <><HiOutlineEnvelope className="w-4 h-4" aria-hidden="true" /> Resend Emails</>}
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </header>

        {recreated && (
          <div className="info-panel no-print mb-4 text-sm">
            Your previous document was no longer on the server, so a new copy was saved. Payment status was not transferred — unlock again if needed.
          </div>
        )}
        {PAYMENTS_UI_ENABLED && paymentCancelled && !paid && (
          <div className="alert-error no-print mb-4">Payment was cancelled. Your preview is still saved.</div>
        )}
        {editError && <div className="alert-error no-print mb-4">{editError}</div>}
        {deleteError && <div className="alert-error no-print mb-4">{deleteError}</div>}
        {showDeleteConfirm && sent && (
          <div className="warn-panel no-print mb-4 text-sm">
            This lease was sent for e-signature. Deleting removes the stored document; any signing links already emailed may no longer match an active record.
          </div>
        )}
        {PAYMENTS_UI_ENABLED && payError && <div className="alert-error no-print mb-4">{payError}</div>}
        {sendError && <div className="alert-error no-print mb-4">{sendError}</div>}
        {resendNote && <div className="alert-success no-print mb-4">{resendNote}</div>}
        {signingActive && (
          <div className="alert-success no-print mb-4">
            <span className="inline-flex items-center gap-1.5">
              <HiCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Awaiting signatures — tenant:{' '}
                <strong>{signing.tenantSigned ? 'signed' : 'pending'}</strong>
                {' · '}
                landlord:{' '}
                <strong>{signing.landlordSigned ? 'signed' : 'pending'}</strong>
              </span>
            </span>
            {(tenantToken || landlordToken) && (
              <span className="block mt-2 text-xs opacity-90 space-y-1">
                {tenantToken && !signing.tenantSigned && (
                  <span className="block">
                    Tenant link:{' '}
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-white">
                      {window.location.origin}/sign/{tenantToken}
                    </code>
                  </span>
                )}
                {landlordToken && !signing.landlordSigned && (
                  <span className="block">
                    Your link (landlord):{' '}
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-white">
                      {window.location.origin}/sign/{landlordToken}
                    </code>
                  </span>
                )}
              </span>
            )}
            <span className="block mt-3 text-xs opacity-90">
              Resend to:{' '}
              {!signing.tenantSigned && (
                <button
                  type="button"
                  onClick={() => handleResend('tenant')}
                  disabled={Boolean(resending)}
                  className="underline hover:no-underline disabled:opacity-60"
                >
                  {resending === 'tenant' ? 'Sending…' : 'tenant only'}
                </button>
              )}
              {!signing.tenantSigned && !signing.landlordSigned && ' · '}
              {!signing.landlordSigned && (
                <button
                  type="button"
                  onClick={() => handleResend('landlord')}
                  disabled={Boolean(resending)}
                  className="underline hover:no-underline disabled:opacity-60"
                >
                  {resending === 'landlord' ? 'Sending…' : 'landlord only'}
                </button>
              )}
            </span>
          </div>
        )}
        {sent && !signingActive && !signingComplete && (
          <div className="alert-success no-print mb-4">
            <span className="inline-flex items-center gap-1.5">
              <HiCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Signing requests sent to <strong>{leaseData.tenantEmail}</strong> (tenant) and{' '}
                <strong>{leaseData.landlordEmail}</strong> (you).
              </span>
            </span>
            {(tenantToken || landlordToken) && (
              <span className="block mt-2 text-xs opacity-90 space-y-1">
                {tenantToken && (
                  <span className="block">
                    Tenant link:{' '}
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-white">
                      {window.location.origin}/sign/{tenantToken}
                    </code>
                  </span>
                )}
                {landlordToken && (
                  <span className="block">
                    Your link (landlord):{' '}
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-white">
                      {window.location.origin}/sign/{landlordToken}
                    </code>
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {!loadError && leaseData && (
          <div className="info-panel no-print mb-5 text-sm space-y-3">
            <p className="font-medium text-heading">Landlord access</p>
            <p className="text-muted">
              Document ID:{' '}
              <code className="text-xs bg-black/10 dark:bg-black/30 px-1.5 py-0.5 rounded break-all">{documentId}</code>
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleDownloadResume} className="btn-secondary text-sm">
                Download lease file
              </button>
            </div>
            {downloadError && (
              <p className="text-red-600 dark:text-red-400 text-xs">{downloadError}</p>
            )}
            {!hasRecoveryPassword && recoveryPasswordEnabled ? (
              <form onSubmit={handleSetRecoveryPassword} className="space-y-2 pt-2 border-t border-line dark:border-line-dark">
                <p className="text-muted">Set a recovery PIN to reopen this lease on another device.</p>
                <input
                  type="password"
                  inputMode="numeric"
                  value={recoveryPw}
                  onChange={(e) => setRecoveryPw(e.target.value)}
                  placeholder="PIN (4+ characters)"
                  className="input-field text-sm"
                  autoComplete="off"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={recoveryPwConfirm}
                  onChange={(e) => setRecoveryPwConfirm(e.target.value)}
                  placeholder="Confirm PIN"
                  className="input-field text-sm"
                  autoComplete="off"
                />
                <button type="submit" disabled={recoverySaving} className="btn-primary text-sm">
                  {recoverySaving ? 'Saving…' : 'Save recovery PIN'}
                </button>
                {recoveryError && <p className="text-red-600 dark:text-red-400 text-xs">{recoveryError}</p>}
              </form>
            ) : hasRecoveryPassword && recoveryPasswordEnabled ? (
              <p className="text-green-700 dark:text-green-300 text-xs">
                {recoverySaved ? 'Recovery PIN saved.' : 'Recovery PIN is set — use it on the home page to reopen this lease.'}
              </p>
            ) : documentIdOnlyAccess ? (
              <p className="text-muted text-xs pt-2 border-t border-line dark:border-line-dark">
                Document ID access is enabled — use “Resume a lease” on the home page with this ID to reopen on another device.
              </p>
            ) : null}
          </div>
        )}
        {leaseData?._preview && (
          <div className="alert-error no-print mb-4 text-sm space-y-2">
            <p>
              This lease is locked because the API is still in charge mode
              (<code className="text-xs">paymentsEnabled=true</code>).
            </p>
            <p>
              On the Pi <code className="text-xs">.env</code>, use exactly:
            </p>
            <pre className="text-xs bg-black/20 p-2 rounded overflow-x-auto">{`PAYMENT_BYPASS=true
CHARGE_LEASES=false
PAYMENTS_ENABLED=false`}</pre>
            <p>
              Then restart the API process (pm2 / systemd), and check{' '}
              <code className="text-xs">/api/health</code> shows{' '}
              <code className="text-xs">paymentBypassed: true</code>. Soft-refresh this page after.
            </p>
          </div>
        )}
        {PAYMENTS_UI_ENABLED && !paid && !paymentBypassed && (
          <div className="payment-banner no-print mb-5">
            <p className="text-sm text-white font-medium">
              Your lease is ready. Pay {price} once to unlock the full document, PDF download, printing, and e-signature.
            </p>
          </div>
        )}

        <LeaseAgreementView data={leaseData} locked={PAYMENTS_UI_ENABLED && !effectivePaid} />
      </div>
    </div>
  )
}
