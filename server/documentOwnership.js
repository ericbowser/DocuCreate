import { pool } from './db.js'

function buildDocumentTitle(leaseData) {
  const parts = [leaseData?.propertyAddress, leaseData?.tenantName].filter(Boolean)
  return parts.join(' — ') || leaseData?.tenantName || null
}

function normalizeLeaseType(leaseType) {
  if (!leaseType) return null
  return String(leaseType).toLowerCase().replace(/\s+/g, '-')
}

/** Link a file-store document to the logged-in user (Postgres). */
export async function recordUserDocument(userId, documentId, leaseData) {
  await pool.query(
    `INSERT INTO docucreate.documents (user_id, document_id, title, lease_type, status)
     VALUES ($1, $2, $3, $4, 'draft')
     ON CONFLICT (document_id) DO UPDATE SET
       title = EXCLUDED.title,
       lease_type = EXCLUDED.lease_type,
       updated_at = NOW()`,
    [userId, documentId, buildDocumentTitle(leaseData), normalizeLeaseType(leaseData?.leaseType)],
  )
}

export async function userOwnsDocument(userId, documentId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM docucreate.documents
     WHERE user_id = $1 AND document_id = $2
     LIMIT 1`,
    [userId, documentId],
  )
  return rows.length > 0
}
