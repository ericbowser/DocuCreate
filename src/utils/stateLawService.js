import { STATE_LAWS, STATES, STATE_LAWS_LAST_REVIEWED } from '../data/stateLaws.js'
import { VACATE_NOTICE_RULES } from '../data/vacateNoticeRules.js'

/**
 * State law access layer (client + server).
 *
 * Today: static modules (stateLaws.js + vacateNoticeRules.js).
 * Tomorrow: swap getStateLawBundle() to query Postgres or an external API
 * without changing wizard / lease document code.
 */

export function getVacateRules(stateCode) {
  return VACATE_NOTICE_RULES[stateCode] ?? {
    landlordMinDays: 30,
    tenantMinDays: 30,
    note: 'Verify current notice requirements with a licensed attorney in your state.',
  }
}

export function getStateLawBundle(stateCode) {
  const core = STATE_LAWS[stateCode]
  if (!core) return null
  return {
    code: stateCode,
    ...core,
    vacateNotice: getVacateRules(stateCode),
    lastReviewed: STATE_LAWS_LAST_REVIEWED,
    disclaimer: 'Reference summary only — not legal advice.',
  }
}

export function listStateLawCodes() {
  return STATES.map((s) => s.code)
}

export function getDefaultVacateNoticeDays(stateCode) {
  const rules = getVacateRules(stateCode)
  return {
    landlordNoticeDays: rules.landlordDefaultDays ?? rules.landlordMinDays,
    tenantNoticeDays: rules.tenantDefaultDays ?? rules.tenantMinDays,
  }
}

/** Parse legacy "30 days" form value */
export function parseLegacyNoticePeriod(noticePeriod) {
  if (!noticePeriod) return null
  const n = parseInt(String(noticePeriod), 10)
  return Number.isFinite(n) ? n : null
}

export function resolveVacateNotice(data) {
  const stateCode = data.state || data.stateData?.code
  const rules = stateCode ? getVacateRules(stateCode) : null
  const defaults = stateCode ? getDefaultVacateNoticeDays(stateCode) : { landlordNoticeDays: 30, tenantNoticeDays: 30 }

  let landlordNoticeDays = data.landlordNoticeDays
  let tenantNoticeDays = data.tenantNoticeDays

  if (landlordNoticeDays == null || landlordNoticeDays === '') {
    landlordNoticeDays = parseLegacyNoticePeriod(data.noticePeriod) ?? defaults.landlordNoticeDays
  }
  if (tenantNoticeDays == null || tenantNoticeDays === '') {
    tenantNoticeDays = parseLegacyNoticePeriod(data.noticePeriod) ?? defaults.tenantNoticeDays
  }

  landlordNoticeDays = Number(landlordNoticeDays)
  tenantNoticeDays = Number(tenantNoticeDays)

  return {
    landlordNoticeDays: Number.isFinite(landlordNoticeDays) ? landlordNoticeDays : defaults.landlordNoticeDays,
    tenantNoticeDays: Number.isFinite(tenantNoticeDays) ? tenantNoticeDays : defaults.tenantNoticeDays,
    rules,
  }
}

export function validateVacateNotice({ stateCode, landlordNoticeDays, tenantNoticeDays }) {
  const rules = getVacateRules(stateCode)
  const errors = []
  const warnings = []

  const landlord = Number(landlordNoticeDays)
  const tenant = Number(tenantNoticeDays)

  if (!Number.isFinite(landlord) || landlord < 1) {
    errors.push('Enter landlord notice days.')
  } else if (landlord < rules.landlordMinDays) {
    errors.push(`Landlord notice must be at least ${rules.landlordMinDays} days in ${STATE_LAWS[stateCode]?.name ?? stateCode}.`)
  }

  if (!Number.isFinite(tenant) || tenant < 1) {
    errors.push('Enter tenant notice days.')
  } else if (tenant < rules.tenantMinDays) {
    errors.push(`Tenant notice must be at least ${rules.tenantMinDays} days in ${STATE_LAWS[stateCode]?.name ?? stateCode}.`)
  }

  if (rules.landlordMinDaysLongTenancy && landlord < rules.landlordMinDaysLongTenancy) {
    warnings.push(
      `Some ${STATE_LAWS[stateCode]?.name ?? stateCode} tenancies may require ${rules.landlordMinDaysLongTenancy} days landlord notice after ${rules.longTenancyMonths ?? 12}+ months.`,
    )
  }

  return { valid: errors.length === 0, errors, warnings, rules }
}

export function formatVacateNoticeSummary({ leaseType, landlordNoticeDays, tenantNoticeDays, isMonthly }) {
  if (isMonthly) {
    return `Month-to-Month: Landlord must give ${landlordNoticeDays} days written notice to end tenancy; Tenant must give ${tenantNoticeDays} days written notice to vacate.`
  }
  return `Fixed term ${landlordNoticeDays !== tenantNoticeDays
    ? `— if not renewing: Landlord ${landlordNoticeDays} days notice, Tenant ${tenantNoticeDays} days notice before vacating`
    : `— if not renewing: ${landlordNoticeDays} days written notice before lease end`}.`
}

export function buildLeasePeriodText({ leaseType, startDate, endDate, landlordNoticeDays, tenantNoticeDays }) {
  const isMonthly = leaseType === 'Month-to-Month'
  if (isMonthly) {
    return `Month-to-Month commencing ${startDate}. Landlord may terminate with ${landlordNoticeDays} days written notice. Tenant may vacate with ${tenantNoticeDays} days written notice.`
  }
  return `${startDate} through ${endDate}. Unless renewed, parties shall provide written notice per the Notice to Vacate terms below if not renewing.`
}

export function buildVacateClauseText({ isMonthly, state, landlordNoticeDays, tenantNoticeDays, startDate, endDate }) {
  if (isMonthly) {
    return `This is a month-to-month tenancy. Landlord may terminate by delivering ${landlordNoticeDays} days written notice to Tenant. Tenant may vacate by delivering ${tenantNoticeDays} days written notice to Landlord. Notice periods shall comply with ${state} law and the minimums stated in this Agreement.`
  }
  return `This Agreement runs from ${startDate} through ${endDate}. If either party does not intend to renew or extend, that party shall provide the other written notice as stated in the Lease Terms: Landlord ${landlordNoticeDays} days, Tenant ${tenantNoticeDays} days before the end of the term (or such longer period as required by ${state} law).`
}
