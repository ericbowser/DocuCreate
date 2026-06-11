// In-memory lease store — replace with a database (SQLite/Postgres) for production
const leases = new Map()

export function storeLease(token, leaseData, { documentId = null } = {}) {
  leases.set(token, {
    token,
    leaseData,
    documentId,
    status: 'pending',           // pending | signed
    tenantPrintedName: null,
    tenantSignatureData: null,   // base64 canvas PNG
    tenantSignedAt: null,
    createdAt: new Date().toISOString(),
  })
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
  return lease
}
