export const RESUME_BUNDLE_VERSION = 1
export const RESUME_FILE_EXTENSION = '.docucreate.json'
export const RESUME_BUNDLE_TYPE = 'docucreate-resume'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function buildResumeBundle({ documentId, accessToken, label }) {
  return {
    version: RESUME_BUNDLE_VERSION,
    type: RESUME_BUNDLE_TYPE,
    documentId,
    accessToken: accessToken || null,
    label: label || null,
    exportedAt: new Date().toISOString(),
  }
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, '')
}

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

/** Server signing store shape (e.g. leases.json) — not a landlord export, but recoverable. */
function parseSigningStoreExport(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const entries = Object.values(data).filter(v => v && typeof v === 'object')
  const signingEntry = entries.find(e => e.leaseData && e.token)
  if (!signingEntry) return null

  if (!signingEntry.documentId) {
    return {
      error:
        'This file looks like server signing data, not a landlord lease file. Use the preview URL or set a recovery PIN on the preview page.',
    }
  }

  return {
    documentId: signingEntry.documentId,
    accessToken: null,
    label: signingEntry.leaseData?.tenantName || null,
    legacyNoToken: true,
    importedFrom: 'signing-store',
  }
}

/** documents.json export — one encrypted record keyed by document ID. */
function parseDocumentsStoreExport(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const ids = Object.keys(data).filter(isUuid)
  if (ids.length !== 1) return null

  const record = data[ids[0]]
  if (!record?.encrypted) return null

  return {
    documentId: ids[0],
    accessToken: null,
    label: null,
    legacyNoToken: true,
    importedFrom: 'documents-store',
  }
}

function successResult({ documentId, accessToken, label, legacyNoToken = false, importedFrom = null }) {
  return {
    documentId,
    accessToken: accessToken || null,
    label: label || null,
    ...(legacyNoToken ? { legacyNoToken: true } : {}),
    ...(importedFrom ? { importedFrom } : {}),
  }
}

export function parseResumeBundle(raw) {
  let data = raw
  if (typeof raw === 'string') {
    const text = stripBom(raw.trim())
    if (!text) return { error: 'Lease file is empty.' }
    try {
      data = JSON.parse(text)
    } catch {
      return {
        error:
          'Invalid lease file format. Use a .docucreate.json file downloaded from the preview page, not server data files unless you know what you are importing.',
      }
    }
  }

  if (data?.type === RESUME_BUNDLE_TYPE && isUuid(data.documentId)) {
    return successResult({
      documentId: data.documentId,
      accessToken: data.accessToken,
      label: data.label,
      legacyNoToken: !data.accessToken,
    })
  }

  if (isUuid(data?.documentId)) {
    return successResult({
      documentId: data.documentId,
      accessToken: data.accessToken,
      label: data.label,
      legacyNoToken: !data.accessToken,
    })
  }

  const fromSigningStore = parseSigningStoreExport(data)
  if (fromSigningStore) return fromSigningStore

  const fromDocumentsStore = parseDocumentsStoreExport(data)
  if (fromDocumentsStore) return fromDocumentsStore

  return {
    error:
      'This file is not a valid DocuCreate lease file. Download one from preview (“Download lease file”), or use your document ID and recovery PIN.',
  }
}

export function downloadResumeBundle(bundle, filenameBase = 'lease-resume') {
  const safe = filenameBase.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'lease-resume'
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safe}${RESUME_FILE_EXTENSION}`
  a.click()
  URL.revokeObjectURL(url)
}

export async function readResumeFile(file) {
  if (!file) return { error: 'No file selected' }
  const text = await file.text()
  return parseResumeBundle(text)
}
