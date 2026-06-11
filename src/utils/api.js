import { DEFAULT_API_PORT } from '../config/apiPort.js'

/** In dev, empty string uses Vite proxy (/api → backend). Set VITE_API_URL in production. */
export const API = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : `http://localhost:${DEFAULT_API_PORT}`)
