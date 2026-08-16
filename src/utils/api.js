function isLoopbackUrl(value) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:|\/|$)/i.test(String(value || '').trim())
}

/**
 * API origin for browser fetches.
 * Production pages on docu-create.com must use same-origin `/api` — never a
 * localhost VITE_API_URL baked in at build time (that would fetch the visitor's machine).
 */
export function getApiBase() {
  const configured = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      if (!configured || isLoopbackUrl(configured)) return ''
    }
  }
  return configured
}

/** @deprecated prefer getApiBase() — kept for existing imports */
export const API = typeof window === 'undefined' ? String(import.meta.env.VITE_API_URL ?? '').trim() : getApiBase()
