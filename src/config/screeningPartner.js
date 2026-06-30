export const SCREENING_PARTNER = {
  enabled: import.meta.env.VITE_SCREENING_ENABLED !== 'false',
  name: import.meta.env.VITE_SCREENING_PARTNER_NAME ?? 'RentPrep',
  baseUrl: import.meta.env.VITE_SCREENING_PARTNER_URL ?? 'https://www.rentprep.com',
  disclosure:
    'DocuCreate may earn a commission if you use this link. Screening is provided by the partner, not DocuCreate.',
}

export const SCREENING_STATUS = {
  ALREADY_SCREENED: 'already_screened',
  WANTS_SCREENING: 'wants_screening',
  SKIPPED: 'skipped',
}

/** Build partner referral URL with UTM params (no tenant PII). */
export function buildPartnerUrl({ state } = {}) {
  const url = new URL(SCREENING_PARTNER.baseUrl)
  url.searchParams.set('utm_source', 'docucreate')
  url.searchParams.set('utm_medium', 'wizard')
  url.searchParams.set('utm_campaign', 'tenant_screening')
  if (state) url.searchParams.set('state', state)
  return url.toString()
}
