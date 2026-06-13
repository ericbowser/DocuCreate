import { formatPhone } from './phoneFormat'
import { parseLegacyNoticePeriod } from './stateLawService'
import { STATES } from '../data/stateLaws'

const FORM_KEY = 'docucreate:wizard:form'
const STEP_KEY = 'docucreate:wizard:step'
const DOC_ID_KEY = 'docucreate:wizard:documentId'
const ACCESS_TOKENS_KEY = 'docucreate:accessTokens'
const RECENT_DOCS_KEY = 'docucreate:recentDocuments'
const TAB_KEY = 'docucreate:tabKey'
const LEGACY_LEASE_KEY = 'leaseData'

/** Session-only — cleared when the browser tab closes (not shared across users on same profile indefinitely). */
const storage = sessionStorage

/** Last wizard step index (review) */
export const WIZARD_REVIEW_STEP = 10

/** Clear wizard draft after idle (shared-device safety) */
export const WIZARD_IDLE_MS = 15 * 60 * 1000

const DEFAULT_FORM = {
  leaseType: 'Fixed Term',
  furnished: 'Unfurnished',
}

function purgeLegacyLocalStorage() {
  try {
    for (const key of [FORM_KEY, STEP_KEY, DOC_ID_KEY, ACCESS_TOKENS_KEY, TAB_KEY, LEGACY_LEASE_KEY]) {
      localStorage.removeItem(key)
    }
  } catch {
    // private browsing / blocked storage
  }
}

purgeLegacyLocalStorage()

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getTabKey() {
  try {
    let key = storage.getItem(TAB_KEY)
    if (!key) {
      key = randomId()
      storage.setItem(TAB_KEY, key)
    }
    return key
  } catch {
    return 'fallback-tab-key'
  }
}

function toBase64(bytes) {
  if (typeof globalThis.btoa === 'function') {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return globalThis.btoa(binary)
  }
  return Buffer.from(bytes).toString('base64')
}

function fromBase64(b64) {
  if (typeof globalThis.atob === 'function') {
    const raw = globalThis.atob(b64)
    const out = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
    return out
  }
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

/** Lightweight obfuscation — stops casual sessionStorage inspection, not a crypto boundary */
function obfuscate(str) {
  const key = getTabKey()
  const bytes = new TextEncoder().encode(str)
  const keyBytes = new TextEncoder().encode(key)
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return toBase64(out)
}

function deobfuscate(encoded) {
  const key = getTabKey()
  const raw = fromBase64(encoded)
  const keyBytes = new TextEncoder().encode(key)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw[i] ^ keyBytes[i % keyBytes.length]
  }
  return new TextDecoder().decode(out)
}

function loadAccessTokens() {
  try {
    const raw = storage.getItem(ACCESS_TOKENS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAccessTokens(map) {
  try {
    storage.setItem(ACCESS_TOKENS_KEY, JSON.stringify(map))
  } catch {
    // quota exceeded — ignore
  }
}

export function saveDocumentAccessToken(documentId, accessToken) {
  if (!documentId || !accessToken) return
  const map = loadAccessTokens()
  map[documentId] = accessToken
  saveAccessTokens(map)
}

export function getDocumentAccessToken(documentId) {
  if (!documentId) return null
  return loadAccessTokens()[documentId] || null
}

export function clearDocumentAccessToken(documentId) {
  if (!documentId) return
  const map = loadAccessTokens()
  delete map[documentId]
  saveAccessTokens(map)
}

export function rememberRecentDocument(documentId, label) {
  if (!documentId) return
  try {
    const list = loadRecentDocuments().filter(d => d.documentId !== documentId)
    list.unshift({
      documentId,
      label: label || 'Lease',
      savedAt: new Date().toISOString(),
    })
    storage.setItem(RECENT_DOCS_KEY, JSON.stringify(list.slice(0, 5)))
  } catch {
    // ignore
  }
}

export function loadRecentDocuments() {
  try {
    const raw = storage.getItem(RECENT_DOCS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function openDocumentSession(documentId, accessToken, label) {
  saveDocumentAccessToken(documentId, accessToken)
  if (label) rememberRecentDocument(documentId, label)
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
    const formRaw = storage.getItem(FORM_KEY)
    const stepRaw = storage.getItem(STEP_KEY)
    const documentId = storage.getItem(DOC_ID_KEY)
    let form = null
    if (formRaw) {
      try {
        form = migrateForm(JSON.parse(deobfuscate(formRaw)))
      } catch {
        form = migrateForm(JSON.parse(formRaw))
      }
    }
    return {
      form,
      step: stepRaw ? Math.max(0, parseInt(stepRaw, 10)) : 0,
      documentId: documentId || null,
    }
  } catch {
    return { form: null, step: 0, documentId: null }
  }
}

export function getEditingDocumentId() {
  try {
    return storage.getItem(DOC_ID_KEY)
  } catch {
    return null
  }
}

export function saveWizardDraft(form, step, documentId) {
  try {
    storage.setItem(FORM_KEY, obfuscate(JSON.stringify(form)))
    storage.setItem(STEP_KEY, String(step))
    if (documentId !== undefined) {
      if (documentId) storage.setItem(DOC_ID_KEY, documentId)
      else storage.removeItem(DOC_ID_KEY)
    }
  } catch {
    // quota exceeded or encoding failure — ignore
  }
}

/** Load preview lease into wizard and open at review step */
export function hydrateWizardFromLease(leaseData, documentId, step = WIZARD_REVIEW_STEP) {
  const form = leaseDataToWizardForm(leaseData)
  saveWizardDraft(form, step, documentId)
  return form
}

export function clearWizardDraft() {
  try {
    storage.removeItem(FORM_KEY)
    storage.removeItem(STEP_KEY)
    storage.removeItem(DOC_ID_KEY)
    storage.removeItem(LEGACY_LEASE_KEY)
  } catch {
    // ignore
  }
}

/** Remove all client-side lease/wizard data for this tab (shared-device safety). */
export function clearSensitiveClientData() {
  clearWizardDraft()
  try {
    storage.removeItem(ACCESS_TOKENS_KEY)
    storage.removeItem(RECENT_DOCS_KEY)
    storage.removeItem(TAB_KEY)
  } catch {
    // ignore
  }
  purgeLegacyLocalStorage()
}

export { DEFAULT_FORM }
