import { getApiBase } from './api'
import { getDocumentAccessToken } from './wizardStorage'

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${getApiBase()}${p}`
}

function extractDocumentId(path, bodyDocumentId) {
  if (bodyDocumentId) return bodyDocumentId
  const match = path.match(/\/api\/documents\/([^/?]+)/)
  return match?.[1] ?? null
}

/** Fetch API routes without browser HTTP cache (lease data must not persist on shared devices). */
export function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const docId = options.documentId ?? extractDocumentId(path, options.bodyDocumentId)

  if (docId) {
    const token = getDocumentAccessToken(docId)
    if (token) headers.set('X-Doc-Access', token)
  }

  return fetch(apiUrl(path), {
    ...options,
    headers,
    cache: 'no-store',
    credentials: options.credentials ?? 'same-origin',
  })
}

/** Parse JSON or throw a clear error when the server returned HTML (e.g. API not running). */
export async function parseJsonResponse(res) {
  const contentType = res.headers?.get?.('content-type') || ''
  if (contentType && !contentType.includes('application/json')) {
    const text = await res.text()
    if (text.trimStart().startsWith('<!') || text.trimStart().toLowerCase().startsWith('<html')) {
      throw new Error('API unavailable — run npm run server (or npm run dev:full).')
    }
    throw new Error(res.ok ? 'Unexpected response from server' : `Request failed (${res.status})`)
  }
  return res.json()
}
