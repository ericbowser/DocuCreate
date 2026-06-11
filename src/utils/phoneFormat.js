/** US country code — only market served */
export const US_PHONE_COUNTRY_CODE = '+1'

/** Strip to 10 US national digits (drops leading 1 if 11 digits) */
export function phoneDigits(value) {
  let d = String(value ?? '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1)
  return d.slice(0, 10)
}

/** National format: (XXX) XXX-XXXX */
export function phoneNationalFormat(value) {
  const d = phoneDigits(value)
  if (!d.length) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/** Full stored/display format: +1 (XXX) XXX-XXXX */
export function formatPhone(value) {
  const national = phoneNationalFormat(value)
  if (!national) return ''
  return `${US_PHONE_COUNTRY_CODE} ${national}`
}

/** National part from stored +1 value (for phone input display) */
export function phoneNationalFromStored(value) {
  if (!value) return ''
  return phoneNationalFormat(String(value).replace(/^\s*\+1\s*/, ''))
}

/** Ensure +1 prefix for lease display (handles legacy values without country code) */
export function displayPhone(value) {
  if (!value) return ''
  const d = phoneDigits(value)
  if (!d.length) return String(value)
  return formatPhone(value)
}

export function isValidPhone(value) {
  return phoneDigits(value).length === 10
}

export const PHONE_VALIDATE = {
  required: 'Required',
  validate: (v) => isValidPhone(v) || 'Enter a valid US phone number (10 digits)',
}
