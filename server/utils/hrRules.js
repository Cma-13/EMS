// The core leave and payroll rules as plain functions (no database),
// so the app and the automated tests use exactly the same logic.

export const WORK_DAYS_PER_MONTH = 26   // daily rate = monthly salary / 26

// ── Dates ────────────────────────────────────────────────

// Read a 'YYYY-MM-DD' string as a LOCAL date.
// (new Date('2026-11-25') is UTC midnight, which is 05:45 in Nepal and made
//  notice periods one day too lenient.)
export const toLocalDay = (d) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d))
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}

// Whole days from today until the leave starts (0 = starts today)
export const noticeDaysUntil = (startDate, now = new Date()) => {
    const today = new Date(now); today.setHours(0, 0, 0, 0)
    return Math.round((toLocalDay(startDate) - today) / 86400000)
}

export const isWeekendKey = (key, weekends) =>
    weekends.includes(new Date(`${key}T00:00:00Z`).getUTCDay())

// Working days among date keys: skips weekends and holidays.
// holidays: Map of 'YYYY-MM-DD' -> holiday name
export const workingDaysIn = (keys, holidays, weekends) => {
    const skipped = []
    let days = 0
    for (const k of keys) {
        if (holidays.has(k))               skipped.push({ date: k, reason: holidays.get(k) })
        else if (isWeekendKey(k, weekends)) skipped.push({ date: k, reason: 'Weekend' })
        else days++
    }
    return { days, skipped }
}

// ── Leave ────────────────────────────────────────────────

// Days the balance can cover are paid, the rest unpaid
export const splitPaidUnpaid = (duration, available) => {
    const paidDays = Math.max(0, Math.min(duration, available))
    return { paidDays, unpaidDays: Math.max(0, duration - paidDays) }
}

// ── Payroll ──────────────────────────────────────────────

export const deductionFor = (monthlySalary, days) =>
    Math.round(((Number(monthlySalary) || 0) / WORK_DAYS_PER_MONTH) * days)

// Absent records that may be deducted: never weekends, holidays or approved-leave days.
// leaveRanges: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }]
export const countableAbsents = (absents, { holidays, weekends, leaveRanges }) =>
    absents.filter(a =>
        !isWeekendKey(a.date, weekends) &&
        !holidays.has(a.date) &&
        !leaveRanges.some(r => r.start <= a.date && a.date <= r.end))

export const netSalary = ({ basic = 0, allowances = 0, other = 0, leaveDeduction = 0, absentDeduction = 0 }) =>
    basic + allowances - other - leaveDeduction - absentDeduction
