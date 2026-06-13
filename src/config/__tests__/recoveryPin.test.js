import { RECOVERY_PIN_MIN_LENGTH, validateRecoveryPin } from '../recoveryPin'

describe('recoveryPin', () => {
  it('accepts a 4-digit numeric PIN', () => {
    expect(validateRecoveryPin('1234')).toBeNull()
  })

  it('accepts longer numeric PINs', () => {
    expect(validateRecoveryPin('987654')).toBeNull()
  })

  it('accepts mixed characters at minimum length', () => {
    expect(validateRecoveryPin('12ab')).toBeNull()
  })

  it('rejects PINs shorter than minimum', () => {
    expect(validateRecoveryPin('123')).toMatch(/at least 4/i)
  })

  it('rejects empty PIN', () => {
    expect(validateRecoveryPin('')).toMatch(/at least/i)
  })

  it('exports minimum length of 4', () => {
    expect(RECOVERY_PIN_MIN_LENGTH).toBe(4)
  })
})
