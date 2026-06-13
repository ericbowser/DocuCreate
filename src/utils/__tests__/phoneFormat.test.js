import {
  formatPhone,
  phoneDigits,
  phoneNationalFormat,
  phoneNationalFromStored,
  displayPhone,
  isValidPhone,
  PHONE_VALIDATE,
} from '../phoneFormat'

describe('phoneFormat', () => {
  describe('phoneDigits', () => {
    it('strips non-digits and leading country code', () => {
      expect(phoneDigits('+1 (801) 555-1234')).toBe('8015551234')
      expect(phoneDigits('18015551234')).toBe('8015551234')
    })

    it('caps at 10 digits', () => {
      expect(phoneDigits('801555123456789')).toBe('8015551234')
    })
  })

  describe('phoneNationalFormat', () => {
    it('formats partial and full numbers', () => {
      expect(phoneNationalFormat('801')).toBe('(801')
      expect(phoneNationalFormat('801555')).toBe('(801) 555')
      expect(phoneNationalFormat('8015551234')).toBe('(801) 555-1234')
    })
  })

  describe('formatPhone', () => {
    it('prefixes +1 for full numbers', () => {
      expect(formatPhone('8015551234')).toBe('+1 (801) 555-1234')
    })

    it('returns empty for blank input', () => {
      expect(formatPhone('')).toBe('')
    })
  })

  describe('phoneNationalFromStored', () => {
    it('strips +1 prefix for input display', () => {
      expect(phoneNationalFromStored('+1 (801) 555-1234')).toBe('(801) 555-1234')
    })
  })

  describe('displayPhone', () => {
    it('normalizes legacy values without country code', () => {
      expect(displayPhone('(801) 555-1234')).toBe('+1 (801) 555-1234')
    })
  })

  describe('isValidPhone', () => {
    it('requires exactly 10 digits', () => {
      expect(isValidPhone('+1 (801) 555-1234')).toBe(true)
      expect(isValidPhone('801555')).toBe(false)
    })
  })

  describe('PHONE_VALIDATE', () => {
    it('returns error message for invalid numbers', () => {
      expect(PHONE_VALIDATE.validate('123')).toMatch(/valid US phone/i)
    })
  })
})
