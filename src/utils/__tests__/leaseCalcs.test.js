import { calcProration, buildMoveInCosts, fmt } from '../leaseCalcs'

describe('leaseCalcs', () => {
  describe('calcProration', () => {
    it('returns null when move-in is on the 1st', () => {
      expect(calcProration('2026-06-01', 1500)).toBeNull()
    })

    it('calculates mid-month proration', () => {
      const result = calcProration('2026-06-15', 3000)
      expect(result).not.toBeNull()
      expect(result.days).toBe(16)
      expect(result.amount).toBeGreaterThan(0)
      expect(result.label).toMatch(/Pro-rated Rent/)
    })

    it('returns null for invalid rent', () => {
      expect(calcProration('2026-06-15', 0)).toBeNull()
    })
  })

  describe('buildMoveInCosts', () => {
    it('includes first month, deposit, and last month when required', () => {
      const { lines, total } = buildMoveInCosts({
        startDate: '2026-06-01',
        monthlyRent: '1000',
        securityDeposit: '500',
        requireLastMonth: true,
      })
      expect(lines.map((l) => l.label)).toEqual([
        "First Month's Rent",
        "Last Month's Rent",
        'Security Deposit',
      ])
      expect(total).toBe(2500)
    })

    it('uses proration instead of full first month when mid-month', () => {
      const { lines } = buildMoveInCosts({
        startDate: '2026-06-15',
        monthlyRent: '3000',
        securityDeposit: '0',
      })
      expect(lines[0].label).toMatch(/Pro-rated Rent/)
    })

    it('excludes received first month from totalDue', () => {
      const result = buildMoveInCosts({
        startDate: '2026-06-01',
        monthlyRent: '1000',
        securityDeposit: '500',
        firstMonthRentReceived: true,
        firstMonthRentReceivedDate: '2026-05-28',
      })
      expect(result.lines[0].paid).toBe(true)
      expect(result.total).toBe(1500)
      expect(result.totalDue).toBe(500)
      expect(result.amountReceived).toBe(1000)
      expect(result.firstMonthReceivedDate).toBe('2026-05-28')
    })
  })

  describe('fmt', () => {
    it('formats numbers as currency strings', () => {
      expect(fmt(1234.5)).toBe('1,234.50')
    })

    it('passes through masked strings', () => {
      expect(fmt('••••')).toBe('••••')
    })

    it('returns em dash for empty values', () => {
      expect(fmt(null)).toBe('—')
    })
  })
})
