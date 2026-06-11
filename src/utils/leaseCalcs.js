/**
 * Calculate prorated rent when tenant moves in mid-month.
 * Returns null if move-in is on the 1st (no proration needed).
 */
export function calcProration(startDate, monthlyRent) {
  if (!startDate || !monthlyRent || parseFloat(monthlyRent) <= 0) return null
  const d = new Date(startDate + 'T12:00:00') // noon avoids DST edge cases
  const day = d.getDate()
  if (day === 1) return null
  const year = d.getFullYear()
  const month = d.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const remainingDays = daysInMonth - day + 1
  const dailyRate = parseFloat(monthlyRent) / daysInMonth
  const amount = parseFloat((dailyRate * remainingDays).toFixed(2))
  const monthName = d.toLocaleString('default', { month: 'short' })
  return {
    amount,
    days: remainingDays,
    daysInMonth,
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    label: `Pro-rated Rent (${monthName} ${day}\u2013${daysInMonth})`,
  }
}

/**
 * Build itemized move-in cost lines and total due at signing.
 */
export function buildMoveInCosts(data) {
  const rent      = parseFloat(data.monthlyRent)     || 0
  const secDep    = parseFloat(data.securityDeposit) || 0
  const petDep    = parseFloat(data.petDeposit)      || 0
  const keyDep    = parseFloat(data.keyDeposit)      || 0
  const parkDep   = parseFloat(data.parkingDeposit)  || 0
  const proration = calcProration(data.startDate, rent)

  const lines = []

  if (proration) {
    lines.push({ label: proration.label, amount: proration.amount })
  } else {
    lines.push({ label: "First Month's Rent", amount: rent })
  }

  if (data.requireLastMonth) {
    lines.push({ label: "Last Month's Rent", amount: rent })
  }

  if (secDep  > 0) lines.push({ label: 'Security Deposit',     amount: secDep  })
  if (petDep  > 0) lines.push({ label: 'Pet Deposit',          amount: petDep  })
  if (keyDep  > 0) lines.push({ label: 'Key / Access Deposit', amount: keyDep  })
  if (parkDep > 0) lines.push({ label: 'Parking Deposit',      amount: parkDep })

  const total = lines.reduce((sum, l) => sum + l.amount, 0)

  return { lines, total, proration }
}

export const fmt = (n) => {
  if (n === null || n === undefined || n === '') return '—'
  if (typeof n === 'string' && /[•*]/.test(n)) return n
  const num = Number(n)
  if (Number.isNaN(num)) return String(n)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
