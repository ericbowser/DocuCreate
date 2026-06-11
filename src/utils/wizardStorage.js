import { formatPhone } from './phoneFormat'
import { parseLegacyNoticePeriod } from './stateLawService'
import { STATES } from '../data/stateLaws'

const FORM_KEY = 'docucreate:wizard:form'
const STEP_KEY = 'docucreate:wizard:step'
const DOC_ID_KEY = 'docucreate:wizard:documentId'

/** Last wizard step index (review) */
export const WIZARD_REVIEW_STEP = 10

const DEFAULT_FORM = {
  leaseType: 'Fixed Term',
  furnished: 'Unfurnished',
}

/** Migrate legacy single-line address / unformatted phone fields */
function migrateForm(parsed) {
  const form = { ...DEFAULT_FORM, ...parsed }

  if (form.landlordAddress && !form.landlordStreet) {
    form.landlordStreet = form.landlordAddress
  }
  if (form.propertyAddress && !form.propertyStreet) {
    form.propertyStreet = form.propertyAddress
  }
  if (form.landlordPhone) form.landlordPhone = formatPhone(form.landlordPhone)
  if (form.tenantPhone) form.tenantPhone = formatPhone(form.tenantPhone)

  if (form.noticePeriod && (form.landlordNoticeDays == null || form.tenantNoticeDays == null)) {
    const days = parseLegacyNoticePeriod(form.noticePeriod) ?? 30
    if (form.landlordNoticeDays == null) form.landlordNoticeDays = days
    if (form.tenantNoticeDays == null) form.tenantNoticeDays = days
  }

  return form
}

function findStateCode(stateName) {
  if (!stateName) return ''
  return STATES.find((s) => s.name === stateName)?.code ?? ''
}

/** Map stored lease payload back to wizard form fields */
export function leaseDataToWizardForm(leaseData) {
  if (!leaseData) return { ...DEFAULT_FORM }

  const {
    stateName,
    stateData,
    docType,
    landlordAddress,
    propertyAddress,
    tenantPrintedName,
    tenantSignedAt,
    _preview,
    ...rest
  } = leaseData

  return migrateForm({
    ...rest,
    docType: typeof docType === 'object' ? docType?.id : docType,
    state: rest.state || stateData?.code || findStateCode(stateName),
  })
}

export function loadWizardDraft() {
  try {
    const formRaw = localStorage.getItem(FORM_KEY)
    const stepRaw = localStorage.getItem(STEP_KEY)
    const documentId = localStorage.getItem(DOC_ID_KEY)
    return {
      form: formRaw ? migrateForm(JSON.parse(formRaw)) : null,
      step: stepRaw ? Math.max(0, parseInt(stepRaw, 10)) : 0,
      documentId: documentId || null,
    }
  } catch {
    return { form: null, step: 0, documentId: null }
  }
}

export function getEditingDocumentId() {
  try {
    return localStorage.getItem(DOC_ID_KEY)
  } catch {
    return null
  }
}

export function saveWizardDraft(form, step, documentId) {
  try {
    localStorage.setItem(FORM_KEY, JSON.stringify(form))
    localStorage.setItem(STEP_KEY, String(step))
    if (documentId !== undefined) {
      if (documentId) localStorage.setItem(DOC_ID_KEY, documentId)
      else localStorage.removeItem(DOC_ID_KEY)
    }
  } catch {
    // quota exceeded — ignore
  }
}

/** Load preview lease into wizard and open at review step */
export function hydrateWizardFromLease(leaseData, documentId, step = WIZARD_REVIEW_STEP) {
  const form = leaseDataToWizardForm(leaseData)
  saveWizardDraft(form, step, documentId)
  return form
}

export function clearWizardDraft() {
  localStorage.removeItem(FORM_KEY)
  localStorage.removeItem(STEP_KEY)
  localStorage.removeItem(DOC_ID_KEY)
}

export { DEFAULT_FORM }
