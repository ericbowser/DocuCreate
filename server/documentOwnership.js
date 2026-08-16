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

/** Remove the My Documents row (and optionally scope to the owner). */
export async function deleteUserDocument(documentId, userId = null) {
  if (userId) {
    await pool.query(
      `DELETE FROM docucreate.documents WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId],
    )
    return
  }
  await pool.query(
    `DELETE FROM docucreate.documents WHERE document_id = $1`,
    [documentId],
  )
}

/**
 * Update metadata on an existing document record by document_id.
 * Safe to call without a userId (e.g. from Stripe webhook).
 * Only provided fields are updated.
 */
export async function updateDocumentRecord(documentId, updates = {}) {
  const setClauses = []
  const values = []
  let idx = 1

  if (updates.title !== undefined) {
    setClauses.push(`title = $${idx++}`)
    values.push(updates.title)
  }
  if (updates.leaseType !== undefined) {
    setClauses.push(`lease_type = $${idx++}`)
    values.push(updates.leaseType)
  }
  if (updates.status !== undefined) {
    setClauses.push(`status = $${idx++}`)
    values.push(updates.status)
  }
  if (updates.paid !== undefined) {
    setClauses.push(`paid = $${idx++}`)
    values.push(updates.paid)
  }

  if (!setClauses.length) return

  setClauses.push('updated_at = NOW()')
  values.push(documentId)

  await pool.query(
    `UPDATE docucreate.documents
     SET ${setClauses.join(', ')}
     WHERE document_id = $${idx}`,
    values,
  )
}
