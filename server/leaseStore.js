import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const LEASES_FILE = path.join(DATA_DIR, 'leases.json')

const leases = new Map()

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(LEASES_FILE)) {
    fs.writeFileSync(LEASES_FILE, JSON.stringify({}, null, 2))
  }
}

function loadLeases() {
  ensureData()
  try {
    const raw = JSON.parse(fs.readFileSync(LEASES_FILE, 'utf8'))
    for (const [token, lease] of Object.entries(raw)) {
      leases.set(token, lease)
    }
  } catch {
    // corrupt or empty — start fresh
  }
}

function persistLeases() {
  ensureData()
  fs.writeFileSync(LEASES_FILE, JSON.stringify(Object.fromEntries(leases), null, 2))
}

loadLeases()

export function storeLease(token, leaseData, { documentId = null } = {}) {
  leases.set(token, {
    token,
    leaseData,
    documentId,
    status: 'pending',
    tenantPrintedName: null,
    tenantSignatureData: null,
    tenantSignedAt: null,
    createdAt: new Date().toISOString(),
  })
  persistLeases()
}

export function getLease(token) {
  return leases.get(token) || null
}

export function deleteLeasesByDocumentId(documentId) {
  if (!documentId) return 0
  let removed = 0
  for (const [token, lease] of leases.entries()) {
    if (lease.documentId === documentId) {
      leases.delete(token)
      removed += 1
    }
  }
  if (removed > 0) persistLeases()
  return removed
}

export function signLease(token, { printedName, signatureData }) {
  const lease = leases.get(token)
  if (!lease) return null
  lease.tenantPrintedName   = printedName
  lease.tenantSignatureData = signatureData
  lease.tenantSignedAt      = new Date().toISOString()
  lease.status              = 'signed'
  leases.set(token, lease)
  persistLeases()
  return lease
}
