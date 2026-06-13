import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SignaturePad from '../components/SignaturePad'

import { apiFetch, parseJsonResponse } from '../utils/fetchApi'
import { clearSensitiveClientData } from '../utils/wizardStorage'
import PageMeta from '../components/PageMeta'
import { resolveVacateNotice } from '../utils/stateLawService'
import { APP_NAME, COMPANY_NAME } from '../config/brand'
import {
  HiExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlinePencil,
  HiOutlineCommandLine,
} from '../icons'

export default function Sign() {
  const { token }    = useParams()
  const [lease,    setLease]    = useState(null)
  const [party,    setParty]    = useState('tenant')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [done,     setDone]     = useState(false)
  const [doneNote, setDoneNote] = useState('')

  // Form state
  const [printedName,    setPrintedName]    = useState('')
  const [signMode,       setSignMode]       = useState('draw')  // 'draw' | 'type'
  const [signatureData,  setSignatureData]  = useState(null)
  const [submitting,     setSubmitting]     = useState(false)

  useEffect(() => {
    apiFetch(`/api/lease/${token}`)
      .then(async (r) => {
        const data = await parseJsonResponse(r)
        if (data.error) setError(data.error)
        else if (data.fullyExecuted || data.status === 'signed' || data.partySigned) {
          setParty(data.party || 'tenant')
          if (data.fullyExecuted || data.status === 'signed') {
            setDoneNote('All required signatures are on file. A confirmation has been sent to both parties.')
          } else if (data.party === 'landlord') {
            setDoneNote('Your signature has been recorded. Waiting for the tenant to sign.')
          } else {
            setDoneNote('Your signature has been recorded. Waiting for the landlord to sign.')
          }
          setDone(true)
        } else {
          setParty(data.party || 'tenant')
          setLease(data)
        }
      })
      .catch((err) => setError(err.message || 'Could not load the lease. The link may have expired.'))
      .finally(() => setLoading(false))

    return () => {
      setLease(null)
      setSignatureData(null)
    }
  }, [token])

  const canSubmit = printedName.trim().length > 2 &&
    (signMode === 'type' || signatureData)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/lease/${token}/sign`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          printedName: printedName.trim(),
          signatureData: signMode === 'type' ? null : signatureData,
        }),
      })
      const data = await parseJsonResponse(res)
      if (data.success) {
        setDone(true)
        if (data.status === 'executed') {
          setDoneNote('All required signatures are on file. A confirmation has been sent to both parties.')
        } else if (party === 'landlord') {
          setDoneNote('Your signature has been recorded. Waiting for the tenant to sign.')
        } else {
          setDoneNote('Your signature has been recorded. Waiting for the landlord to sign.')
        }
        clearSensitiveClientData()
      }
      else setError(data.error || 'Signing failed.')
    } catch {
      setError('Signing failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <>
      <PageMeta title="Sign Lease" noindex privateSession />
      <Centered><Spinner />Loading your lease...</Centered>
    </>
  )

  if (error) return (
    <Centered>
      <div className="text-center space-y-3">
        <HiExclamationTriangle className="w-12 h-12 text-amber-500 mx-auto" aria-hidden="true" />
        <p className="text-body font-medium">{error}</p>
        <p className="text-sm text-muted">If you believe this is an error, contact your landlord.</p>
      </div>
    </Centered>
  )

  if (done) return (
    <Centered>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto">
          <HiOutlineCheckCircle className="w-9 h-9 text-green-700 dark:text-green-300" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-heading">Lease Signed!</h2>
        <p className="text-muted text-sm max-w-sm">
          {doneNote || 'Your signature has been recorded.'}
        </p>
      </div>
    </Centered>
  )

  const d = lease.leaseData
  const isLandlord = party === 'landlord'
  const isMonthly = d.leaseType === 'Month-to-Month'
  const { landlordNoticeDays, tenantNoticeDays } = resolveVacateNotice(d)
  const defaultName = isLandlord ? d.landlordName : d.tenantName

  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-heading">
            {isLandlord ? 'Review & Sign as Landlord' : 'Review & Sign Your Lease'}
          </h1>
          <p className="text-sm text-muted mt-1">
            {isLandlord
              ? 'Please review the terms below, then sign to complete your side of the agreement.'
              : 'Please review the terms below, then sign at the bottom to accept.'}
          </p>
        </div>

        {/* Lease Summary */}
        <div className="card-surface p-6 space-y-0 divide-y divide-line dark:divide-line-dark">
          <h2 className="text-base font-semibold text-heading pb-3">Lease Summary</h2>
          {[
            { label: 'Property',       value: d.propertyAddress },
            { label: 'Room',           value: d.roomDescription },
            { label: 'Landlord',       value: `${d.landlordName} — ${d.landlordEmail}` },
            { label: 'Tenant',         value: d.tenantName },
            { label: 'Lease Type',     value: d.leaseType },
            { label: 'Start Date',     value: d.startDate },
            { label: 'End Date',       value: isMonthly ? 'Month-to-Month' : d.endDate },
            { label: 'Landlord Notice', value: `${landlordNoticeDays} days to vacate` },
            { label: 'Tenant Notice',   value: `${tenantNoticeDays} days to vacate` },
            { label: 'Monthly Rent',   value: `$${Number(d.monthlyRent).toLocaleString()}` },
            { label: 'Security Dep.',  value: `$${Number(d.securityDeposit).toLocaleString()}` },
            { label: 'Rent Due',       value: `Day ${d.rentDueDay} of each month` },
            { label: 'Late Fee',       value: `$${d.lateFee}` },
            { label: 'Pet Policy',     value: d.petPolicy },
            { label: 'Utilities',      value: Array.isArray(d.utilities) && d.utilities.length ? d.utilities.join(', ') : 'None included' },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4 py-2.5">
              <span className="text-sm text-muted w-32 shrink-0">{label}</span>
              <span className="text-sm font-medium text-heading">{value || '—'}</span>
            </div>
          ))}
          {d.houseRules && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">House Rules</p>
              <p className="text-sm text-body leading-relaxed">{d.houseRules}</p>
            </div>
          )}
        </div>

        {/* Legal Acknowledgement */}
        <div className="warn-panel text-sm">
          By signing below you confirm you have read and agree to all terms of this Room Rental Lease Agreement,
          including rent obligations, security deposit terms, house rules, and any state-specific provisions.
          This constitutes a legally binding agreement.
        </div>

        {/* Signature Block */}
        <div className="card-surface p-6 space-y-5">
          <h2 className="text-base font-semibold text-heading">Your Signature</h2>

          {/* Printed Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-body">
              Full Legal Name <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={printedName}
              onChange={e => setPrintedName(e.target.value)}
              placeholder={defaultName || 'Enter your full legal name'}
              className="input-field"
            />
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-slate-200/80 dark:bg-surface-elevated rounded-xl w-fit">
            {['draw', 'type'].map(mode => (
              <button key={mode} type="button" onClick={() => setSignMode(mode)}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  signMode === mode
                    ? 'bg-white dark:bg-surface-input text-heading shadow-sm'
                    : 'text-muted'
                }`}>
                {mode === 'draw'
                  ? <><HiOutlinePencil className="w-4 h-4" aria-hidden="true" /> Draw</>
                  : <><HiOutlineCommandLine className="w-4 h-4" aria-hidden="true" /> Type</>}
              </button>
            ))}
          </div>

          {/* Draw */}
          {signMode === 'draw' && <SignaturePad onChange={setSignatureData} />}

          {/* Type */}
          {signMode === 'type' && (
            <div className="border-b-2 border-ink dark:border-ink-on-dark py-3 min-h-[56px] flex items-center">
              <span className="text-3xl text-heading"
                style={{ fontFamily: "'Brush Script MT', cursive" }}>
                {printedName || <span className="text-subtle text-base font-sans">Your name will appear here</span>}
              </span>
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-muted">
            Date of signing: <span className="font-medium text-body">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-surface-elevated disabled:text-ink-subtle dark:disabled:text-ink-on-dark-subtle disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {submitting ? 'Submitting...' : 'Accept & Sign Lease →'}
          </button>
        </div>

        <p className="text-center text-xs text-subtle pb-6">
          Powered by {APP_NAME} · {COMPANY_NAME}
        </p>
      </div>
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="card-surface p-10">{children}</div>
    </div>
  )
}

function Spinner() {
  return <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
}
