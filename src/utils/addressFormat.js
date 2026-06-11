import { STATE_LAWS } from '../data/stateLaws'

export function stateLabel(code) {
  if (!code) return ''
  return STATE_LAWS[code]?.name ?? code
}

/** Build a single-line US mailing address from parts */
export function formatAddress({ street, city, state, zip }) {
  if (!street?.trim() && !city?.trim()) return ''

  const statePart = stateLabel(state?.trim()) || state?.trim() || ''
  const cityState = [city?.trim(), statePart].filter(Boolean).join(', ')
  const cityStateZip = [cityState, zip?.trim()].filter(Boolean).join(' ').trim()

  if (cityStateZip) return `${street?.trim()}, ${cityStateZip}`
  return street?.trim() ?? ''
}

export function resolveLandlordAddress(data) {
  if (data.landlordStreet?.trim()) {
    return formatAddress({
      street: data.landlordStreet,
      city: data.landlordCity,
      state: data.landlordState,
      zip: data.landlordZip,
    })
  }
  return data.landlordAddress ?? ''
}

export function resolvePropertyAddress(data) {
  if (data.propertyStreet?.trim()) {
    return formatAddress({
      street: data.propertyStreet,
      city: data.propertyCity,
      state: data.propertyState,
      zip: data.propertyZip,
    })
  }
  return data.propertyAddress ?? ''
}

export const ZIP_VALIDATE = {
  required: 'Required',
  pattern: {
    value: /^\d{5}(-\d{4})?$/,
    message: 'Enter a valid ZIP (12345 or 12345-6789)',
  },
}
