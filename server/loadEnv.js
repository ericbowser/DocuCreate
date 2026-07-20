/**
 * Load environment before any other server module reads process.env.
 * Canonical location: project root `.env`. Legacy fallback: `src/.env`.
 *
 * Also normalizes common keys to UPPER_SNAKE so Linux (Pi) matches Windows
 * when someone writes payments_enabled=false instead of PAYMENTS_ENABLED=false.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

dotenv.config({ path: path.join(root, '.env') })
dotenv.config({ path: path.join(root, 'src', '.env') })

const ALIASES = [
  'APP_URL',
  'API_PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'SESSION_SECRET',
  'DOCUMENT_ENCRYPTION_KEY',
  'DOCUMENT_ID_ACCESS',
  'PAYMENTS_ENABLED',
  'CHARGE_LEASES',
  'PAYMENT_BYPASS',
  'LEASE_PRICE_CENTS',
  'STRIPE_CURRENCY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'EMAIL_USER',
  'EMAIL_RECEIVE',
  'EMAIL_APP_PASSWORD',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REFRESH_TOKEN',
]

function envLookup(name) {
  if (process.env[name] != null && process.env[name] !== '') return process.env[name]
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(process.env)) {
    if (key.toLowerCase() === lower && value != null && value !== '') return value
  }
  return undefined
}

for (const name of ALIASES) {
  const value = envLookup(name)
  if (value != null) process.env[name] = String(value).trim()
}

/** True only for explicit truthy strings (true / 1 / yes). */
export function envFlagTrue(name) {
  const raw = envLookup(name)
  if (raw == null) return false
  return ['true', '1', 'yes', 'on'].includes(String(raw).trim().toLowerCase())
}
