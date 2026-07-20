import crypto from 'crypto'
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

function computeStatus(lease) {
  const tenantDone = Boolean(lease.tenantSignedAt)
  const landlordDone = Boolean(lease.landlordSignedAt)
  if (tenantDone && landlordDone) return 'executed'
  if (tenantDone || landlordDone) return 'partial'
  return 'pending'
}

function syncSigningGroup(signingGroupId, apply) {
  for (const [token, lease] of leases.entries()) {
    if (lease.signingGroupId !== signingGroupId) continue
    apply(lease)
    lease.status = computeStatus(lease)
    leases.set(token, lease)
  }
  persistLeases()
}

loadLeases()

/** @deprecated Use createSigningGroup — kept for any in-flight single-token records */
export function storeLease(token, leaseData, { documentId = null } = {}) {
  leases.set(token, {
    token,
    party: 'tenant',
    signingGroupId: null,
    leaseData,
    documentId,
    status: 'pending',
    tenantPrintedName: null,
    tenantSignatureData: null,
    tenantSignedAt: null,
    landlordPrintedName: null,
    landlordSignatureData: null,
    landlordSignedAt: null,
    createdAt: new Date().toISOString(),
  })
  persistLeases()
}

export function createSigningGroup(leaseData, { documentId = null } = {}) {
  const signingGroupId = crypto.randomUUID()
  const tenantToken = crypto.randomUUID()
  const landlordToken = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const base = {
    signingGroupId,
    leaseData,
    documentId,
    status: 'pending',
    tenantPrintedName: null,
    tenantSignatureData: null,
    tenantSignedAt: null,
    landlordPrintedName: null,
    landlordSignatureData: null,
    landlordSignedAt: null,
    createdAt,
  }

  leases.set(tenantToken, { ...base, token: tenantToken, party: 'tenant' })
  leases.set(landlordToken, { ...base, token: landlordToken, party: 'landlord' })
  persistLeases()

  return { tenantToken, landlordToken, signingGroupId }
}

export function getLease(token) {
  const lease = leases.get(token)
  if (!lease) return null

  const party = lease.party || 'tenant'
  const partySigned = party === 'landlord'
    ? Boolean(lease.landlordSignedAt)
    : Boolean(lease.tenantSignedAt)

  return {
    ...lease,
    party,
    partySigned,
    fullyExecuted: lease.status === 'executed' || lease.status === 'signed',
  }
}

export function getSigningTokens(signingGroupId) {
  if (!signingGroupId) return []
  const out = []
  for (const [token, lease] of leases.entries()) {
    if (lease.signingGroupId === signingGroupId) {
      out.push({ token, party: lease.party || 'tenant' })
    }
  }
  return out
}

export function getSigningGroupForDocument(documentId) {
  if (!documentId) return null

  const entries = []
  for (const lease of leases.values()) {
    if (lease.documentId === documentId) entries.push(lease)
  }
  if (!entries.length) return null

  const tenantEntry = entries.find(l => l.party === 'tenant')
    || entries.find(l => !l.party || l.party === 'tenant')
    || entries[0]
  const landlordEntry = entries.find(l => l.party === 'landlord')

  const tenantSigned = Boolean(tenantEntry?.tenantSignedAt)
  const landlordSigned = Boolean(landlordEntry?.landlordSignedAt ?? tenantEntry?.landlordSignedAt)
  const status = tenantEntry ? computeStatus(tenantEntry) : 'pending'

  return {
    signingGroupId: tenantEntry?.signingGroupId ?? null,
    tenantToken: tenantEntry?.token ?? null,
    landlordToken: landlordEntry?.token ?? null,
    status,
    tenantSigned,
    landlordSigned,
    fullyExecuted: status === 'executed' || tenantEntry?.status === 'signed',
  }
}

/** Add a landlord signing link to legacy single-token sends without invalidating the tenant link. */
export function ensureDualSigningGroup(documentId) {
  const group = getSigningGroupForDocument(documentId)
  if (!group?.tenantToken) return null
  if (group.landlordToken) return group

  const tenantLease = leases.get(group.tenantToken)
  if (!tenantLease) return null

  const signingGroupId = tenantLease.signingGroupId || crypto.randomUUID()
  const landlordToken = crypto.randomUUID()

  tenantLease.signingGroupId = signingGroupId
  tenantLease.party = tenantLease.party || 'tenant'
  leases.set(group.tenantToken, tenantLease)

  leases.set(landlordToken, {
    ...tenantLease,
    token: landlordToken,
    party: 'landlord',
    signingGroupId,
  })
  persistLeases()

  return getSigningGroupForDocument(documentId)
}

export function buildSigningSummary(documentId) {
  const group = getSigningGroupForDocument(documentId)
  if (!group) return null

  return {
    sent: true,
    status: group.status,
    tenantSigned: group.tenantSigned,
    landlordSigned: group.landlordSigned,
    fullyExecuted: group.fullyExecuted,
    tenantToken: group.tenantToken,
    landlordToken: group.landlordToken,
  }
}

/** Signature fields from the signing store (for merging into the lease document). */
export function getSigningArtifacts(documentId) {
  if (!documentId) return null
  for (const lease of leases.values()) {
    if (lease.documentId !== documentId) continue
    if (
      lease.tenantSignedAt ||
      lease.landlordSignedAt ||
      lease.tenantSignatureData ||
      lease.landlordSignatureData
    ) {
      return {
        tenantPrintedName: lease.tenantPrintedName ?? null,
        tenantSignedAt: lease.tenantSignedAt ?? null,
        tenantSignatureData: lease.tenantSignatureData ?? null,
        landlordPrintedName: lease.landlordPrintedName ?? null,
        landlordSignedAt: lease.landlordSignedAt ?? null,
        landlordSignatureData: lease.landlordSignatureData ?? null,
      }
    }
  }
  return null
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

  const party = lease.party || 'tenant'
  const alreadySigned = party === 'landlord'
    ? Boolean(lease.landlordSignedAt)
    : Boolean(lease.tenantSignedAt)

  if (alreadySigned) return { ...lease, party, alreadySigned: true }

  const now = new Date().toISOString()
  const updates = party === 'landlord'
    ? {
        landlordPrintedName: printedName,
        landlordSignatureData: signatureData,
        landlordSignedAt: now,
      }
    : {
        tenantPrintedName: printedName,
        tenantSignatureData: signatureData,
        tenantSignedAt: now,
      }

  if (lease.signingGroupId) {
    syncSigningGroup(lease.signingGroupId, (entry) => Object.assign(entry, updates))
  } else {
    Object.assign(lease, updates)
    lease.status = party === 'landlord' ? computeStatus(lease) : 'signed'
    leases.set(token, lease)
    persistLeases()
  }

  const updated = leases.get(token)
  return { ...updated, party, alreadySigned: false }
}
