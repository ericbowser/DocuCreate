import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { encryptPayload, decryptPayload } from './crypto.js'
import { generateAccessToken, hashAccessToken, verifyAccessToken, hashRecoveryPassword, verifyRecoveryPassword, validateRecoveryPin } from './documentAccess.js'
import { isPaymentBypassed } from './stripe.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json')

const documents = new Map()

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DOCUMENTS_FILE)) {
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify({}, null, 2))
  }
}

function loadDocuments() {
  ensureData()
  try {
    const raw = JSON.parse(fs.readFileSync(DOCUMENTS_FILE, 'utf8'))
    for (const [id, doc] of Object.entries(raw)) {
      documents.set(id, doc)
    }
  } catch {
    // corrupt or empty — start fresh
  }
}

function persistDocuments() {
  ensureData()
  fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(Object.fromEntries(documents), null, 2))
}

loadDocuments()

const LOCKED = '[locked]'

/** Fully redact PII for unpaid preview — no reconstructible fragments */
export function buildMaskedPreview(leaseData) {
  return {
    docType: leaseData.docType,
    stateName: leaseData.stateName,
    stateData: leaseData.stateData
      ? { name: leaseData.stateData.name, disclosures: leaseData.stateData.disclosures }
      : null,
    landlordName: '[Landlord]',
    landlordAddress: LOCKED,
    landlordPhone: LOCKED,
    landlordEmail: LOCKED,
    tenantName: '[Tenant]',
    tenantPhone: LOCKED,
    tenantEmail: LOCKED,
    businessName: leaseData.businessName ? LOCKED : undefined,
    propertyAddress: LOCKED,
    propertyDescription: LOCKED,
    roomDescription: LOCKED,
    sharedAreas: leaseData.sharedAreas ? LOCKED : undefined,
    permittedUse: leaseData.permittedUse ? LOCKED : undefined,
    squareFootage: leaseData.squareFootage ? LOCKED : undefined,
    furnished: leaseData.furnished,
    leaseType: leaseData.leaseType,
    startDate: leaseData.startDate,
    endDate: leaseData.endDate,
    noticePeriod: leaseData.noticePeriod,
    landlordNoticeDays: leaseData.landlordNoticeDays,
    tenantNoticeDays: leaseData.tenantNoticeDays,
    monthlyRent: LOCKED,
    securityDeposit: LOCKED,
    rentDueDay: leaseData.rentDueDay,
    lateFee: LOCKED,
    keyDeposit: leaseData.keyDeposit ? LOCKED : undefined,
    parkingDeposit: leaseData.parkingDeposit ? LOCKED : undefined,
    requireLastMonth: leaseData.requireLastMonth,
    utilities: Array.isArray(leaseData.utilities) ? leaseData.utilities : [],
    petPolicy: leaseData.petPolicy,
    petDeposit: leaseData.petDeposit ? LOCKED : undefined,
    houseRules: leaseData.houseRules ? LOCKED : undefined,
    _preview: true,
  }
}

export function verifyDocumentAccess(documentId, accessToken) {
  const doc = documents.get(documentId)
  if (!doc) return { ok: false, reason: 'not_found' }
  return verifyAccessToken(doc.accessTokenHash, accessToken)
}

export function updateDocument(id, leaseData) {
  const doc = documents.get(id)
  if (!doc) return false
  doc.encrypted = encryptPayload(leaseData)
  documents.set(id, doc)
  persistDocuments()
  return true
}

export function createDocument(leaseData) {
  const id = crypto.randomUUID()
  const accessToken = generateAccessToken()
  const encrypted = encryptPayload(leaseData)
  const freeUnlock = isPaymentBypassed()
  const now = new Date().toISOString()
  documents.set(id, {
    id,
    encrypted,
    accessTokenHash: hashAccessToken(accessToken),
    paymentStatus: freeUnlock ? 'paid' : 'pending',
    stripeSessionId: null,
    paidAt: freeUnlock ? now : null,
    createdAt: now,
  })
  persistDocuments()
  return { id, accessToken }
}

/** When payments are off, mark any legacy pending docs as paid (idempotent). */
export function unlockAllPendingIfBypassed() {
  if (!isPaymentBypassed()) return 0
  let count = 0
  for (const [id, doc] of documents.entries()) {
    if (doc.paymentStatus !== 'paid') {
      doc.paymentStatus = 'paid'
      doc.paidAt = doc.paidAt || new Date().toISOString()
      documents.set(id, doc)
      count++
    }
  }
  if (count > 0) persistDocuments()
  return count
}

export function getDocument(id) {
  return documents.get(id) || null
}

export function getDecryptedLease(id) {
  const doc = documents.get(id)
  if (!doc) return null
  try {
    return decryptPayload(doc.encrypted)
  } catch {
    return null
  }
}

export function markDocumentPaid(id, { stripeSessionId } = {}) {
  const doc = documents.get(id)
  if (!doc) return null
  doc.paymentStatus = 'paid'
  doc.stripeSessionId = stripeSessionId ?? doc.stripeSessionId
  doc.paidAt = new Date().toISOString()
  documents.set(id, doc)
  persistDocuments()
  return doc
}

export function isDocumentPaid(id) {
  const doc = documents.get(id)
  return doc?.paymentStatus === 'paid'
}

export function getDocumentMeta(id) {
  const doc = documents.get(id)
  if (!doc) return null
  return {
    id: doc.id,
    paymentStatus: doc.paymentStatus,
    paidAt: doc.paidAt,
    createdAt: doc.createdAt,
    requiresAccessToken: Boolean(doc.accessTokenHash),
    hasRecoveryPassword: Boolean(doc.recoveryPassword),
  }
}

export function setDocumentRecoveryPassword(documentId, password) {
  const doc = documents.get(documentId)
  if (!doc) return { error: 'Document not found', status: 404 }
  const pinError = validateRecoveryPin(password)
  if (pinError) {
    return { error: pinError, status: 400 }
  }
  doc.recoveryPassword = hashRecoveryPassword(password)
  documents.set(documentId, doc)
  persistDocuments()
  return { ok: true }
}

/** Landlord recovery: verify password and issue a fresh session access token. */
export function unlockDocumentWithPassword(documentId, password) {
  const doc = documents.get(documentId)
  if (!doc?.recoveryPassword) return { ok: false }
  if (!verifyRecoveryPassword(password, doc.recoveryPassword)) return { ok: false }

  const accessToken = generateAccessToken()
  doc.accessTokenHash = hashAccessToken(accessToken)
  documents.set(documentId, doc)
  persistDocuments()
  return { ok: true, accessToken }
}

export function deleteDocument(id) {
  const ok = documents.delete(id)
  if (ok) persistDocuments()
  return ok
}
