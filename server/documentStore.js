import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { encryptPayload, decryptPayload } from './crypto.js'

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

/** Redact sensitive fields for unpaid preview — never send full data to client */
export function buildMaskedPreview(leaseData) {
  const mask = (s, keep = 2) => {
    if (!s || typeof s !== 'string') return '••••••••'
    if (s.length <= keep) return '••••'
    return s.slice(0, keep) + '•'.repeat(Math.min(12, s.length - keep))
  }

  const maskEmail = (e) => {
    if (!e || !e.includes('@')) return '••••@••••.com'
    const [user, domain] = e.split('@')
    return `${mask(user, 1)}@${mask(domain, 2)}`
  }

  return {
    docType: leaseData.docType,
    stateName: leaseData.stateName,
    stateData: leaseData.stateData
      ? { name: leaseData.stateData.name, disclosures: leaseData.stateData.disclosures }
      : null,
    landlordName: mask(leaseData.landlordName, 3),
    landlordAddress: mask(leaseData.landlordAddress, 8),
    landlordPhone: '•••-•••-••••',
    landlordEmail: maskEmail(leaseData.landlordEmail),
    tenantName: mask(leaseData.tenantName, 3),
    tenantPhone: '•••-•••-••••',
    tenantEmail: maskEmail(leaseData.tenantEmail),
    businessName: leaseData.businessName ? mask(leaseData.businessName, 4) : undefined,
    propertyAddress: mask(leaseData.propertyAddress, 10),
    propertyDescription: mask(leaseData.propertyDescription || leaseData.roomDescription, 6),
    roomDescription: mask(leaseData.roomDescription, 6),
    sharedAreas: leaseData.sharedAreas ? mask(leaseData.sharedAreas, 4) : undefined,
    permittedUse: leaseData.permittedUse ? mask(leaseData.permittedUse, 6) : undefined,
    squareFootage: leaseData.squareFootage ? '••••' : undefined,
    furnished: leaseData.furnished,
    leaseType: leaseData.leaseType,
    startDate: leaseData.startDate,
    endDate: leaseData.endDate,
    noticePeriod: leaseData.noticePeriod,
    monthlyRent: '••••',
    securityDeposit: '••••',
    rentDueDay: leaseData.rentDueDay,
    lateFee: '•••',
    keyDeposit: leaseData.keyDeposit ? '•••' : undefined,
    parkingDeposit: leaseData.parkingDeposit ? '•••' : undefined,
    requireLastMonth: leaseData.requireLastMonth,
    utilities: Array.isArray(leaseData.utilities) ? leaseData.utilities : [],
    petPolicy: leaseData.petPolicy,
    petDeposit: leaseData.petDeposit ? '•••' : undefined,
    houseRules: leaseData.houseRules
      ? leaseData.houseRules.slice(0, 40) + (leaseData.houseRules.length > 40 ? '… [locked]' : '')
      : undefined,
    _preview: true,
  }
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
  const encrypted = encryptPayload(leaseData)
  documents.set(id, {
    id,
    encrypted,
    paymentStatus: 'pending',
    stripeSessionId: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
  })
  persistDocuments()
  return id
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
  }
}

export function deleteDocument(id) {
  const ok = documents.delete(id)
  if (ok) persistDocuments()
  return ok
}
