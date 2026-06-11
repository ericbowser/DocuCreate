import { API } from './api'

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API}${p}`
}

/** Parse JSON or throw a clear error when the server returned HTML (e.g. API not running). */
export async function parseJsonResponse(res) {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    if (text.trimStart().startsWith('<!') || text.trimStart().toLowerCase().startsWith('<html')) {
      throw new Error('API unavailable — run npm run server (or npm run dev:full).')
    }
    throw new Error(res.ok ? 'Unexpected response from server' : `Request failed (${res.status})`)
  }
  return res.json()
}
