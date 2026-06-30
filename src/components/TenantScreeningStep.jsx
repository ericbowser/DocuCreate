import { apiFetch } from '../utils/fetchApi'
import {
  SCREENING_PARTNER,
  SCREENING_STATUS,
  buildPartnerUrl,
} from '../config/screeningPartner'

const OPTIONS = [
  { value: SCREENING_STATUS.ALREADY_SCREENED, label: 'Yes, already screened' },
  { value: SCREENING_STATUS.WANTS_SCREENING, label: 'Not yet — I\'d like a screening option' },
  { value: SCREENING_STATUS.SKIPPED, label: 'Skip for now' },
]

function logPartnerClick({ state, status }) {
  const payload = JSON.stringify({
    state: state || null,
    status: status || null,
    partner: SCREENING_PARTNER.name,
  })
  const url = '/api/events/screening-click'
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))
    return
  }
  apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }).catch(() => {})
}

export default function TenantScreeningStep({ register, watch, selectedState }) {
  const status = watch('tenantScreeningStatus')
  const partnerUrl = buildPartnerUrl({ state: selectedState })
  const showPartnerCta =
    SCREENING_PARTNER.enabled &&
    (status === SCREENING_STATUS.WANTS_SCREENING || !status)

  const handlePartnerClick = () => {
    logPartnerClick({ state: selectedState, status })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted leading-relaxed">
        Many landlords screen tenants before signing a lease. DocuCreate does not run
        background checks or provide consumer reports.
      </p>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-body mb-1">
          Have you screened this tenant?
        </legend>
        {OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all shadow-card-sm ${
              status === value
                ? 'border-accent bg-accent-muted dark:bg-ember-900/40 dark:border-ember-500/55'
                : 'border-line dark:border-white/[0.12] hover:bg-slate-50 dark:hover:bg-white/[0.08]'
            }`}
          >
            <input
              type="radio"
              value={value}
              {...register('tenantScreeningStatus')}
              className="w-4 h-4 accent-blue-600 shrink-0"
            />
            <span className={`text-sm ${status === value ? 'font-semibold text-blue-800 dark:text-white' : 'text-body'}`}>
              {label}
            </span>
          </label>
        ))}
      </fieldset>

      {showPartnerCta && (
        <div className="info-panel space-y-3">
          <p className="text-sm text-body">
            You can screen this tenant through our partner. You will leave DocuCreate to
            complete screening on their site.
          </p>
          <a
            href={partnerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePartnerClick}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Screen tenant with {SCREENING_PARTNER.name} →
          </a>
          <p className="text-xs text-subtle">{SCREENING_PARTNER.disclosure}</p>
        </div>
      )}

      <p className="text-xs text-subtle">
        Screening is optional. You can continue creating your lease without it.
      </p>
    </div>
  )
}
