import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

function getKey() {
  const secret = process.env.DOCUMENT_ENCRYPTION_KEY
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('DOCUMENT_ENCRYPTION_KEY is required in production (openssl rand -hex 32)')
  }
  return scryptSync(secret || 'docucreate-dev-key-change-in-production', 'docucreate-salt-v1', 32)
}

export function encryptPayload(data) {
  const key = getKey()
  const iv  = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptPayload(encoded) {
  const key = getKey()
  const buf = Buffer.from(encoded, 'base64')
  const iv  = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return JSON.parse(dec.toString('utf8'))
}
