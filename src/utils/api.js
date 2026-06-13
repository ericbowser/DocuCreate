/** In dev, empty string uses Vite proxy (/api → backend). In production, same-origin /api unless VITE_API_URL is set. */
export const API = import.meta.env.VITE_API_URL ?? ''
