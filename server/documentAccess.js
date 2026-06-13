import crypto from 'crypto'
import { RECOVERY_PIN_MIN_LENGTH, RECOVERY_PIN_MAX_LENGTH, validateRecoveryPin } from '../src/config/recoveryPin.js'

export { RECOVERY_PIN_MIN_LENGTH, RECOVERY_PIN_MAX_LENGTH, validateRecoveryPin }
/** @deprecated use RECOVERY_PIN_MIN_LENGTH */
export const RECOVERY_PASSWORD_MIN_LENGTH = RECOVERY_PIN_MIN_LENGTH

export function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashAccessToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** @returns {{ ok: boolean, reason?: 'not_found'|'token_required'|'invalid_token', legacy?: boolean }} */
export function verifyAccessToken(storedHash, accessToken) {
  if (!storedHash) return { ok: true, legacy: true }
  if (!accessToken) return { ok: false, reason: 'token_required' }
  const hash = hashAccessToken(accessToken)
  if (hash.length !== storedHash.length) return { ok: false, reason: 'invalid_token' }
  if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
    return { ok: false, reason: 'invalid_token' }
  }
  return { ok: true }
}

const RECOVERY_SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

export function hashRecoveryPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 32, RECOVERY_SCRYPT)
  return { salt: salt.toString('hex'), hash: hash.toString('hex') }
}

export function verifyRecoveryPassword(password, stored) {
  if (!stored?.salt || !stored?.hash || !password) return false
  try {
    const salt = Buffer.from(stored.salt, 'hex')
    const expected = Buffer.from(stored.hash, 'hex')
    const actual = crypto.scryptSync(password, salt, 32, RECOVERY_SCRYPT)
    if (expected.length !== actual.length) return false
    return crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}
