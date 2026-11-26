import Holiday from '../models/Holiday.js'

// Working-day helpers shared by leave and payroll.
// Dates are handled as 'YYYY-MM-DD' keys in UTC, the same way leave dates
// (new Date('YYYY-MM-DD')) and attendance/holiday date strings are stored.

// Weekly off days from server/.env (0=Sun ... 6=Sat). Default: Saturday.
export const weekendDays = () =>
    (process.env.WEEKEND_DAYS || '6').split(',').map(s => Number(s.trim())).filter(n => n >= 0 && n <= 6)

export const toKey = (d) => {
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
    return new Date(d).toISOString().slice(0, 10)
}

export const isWeekendKey = (key, weekends = weekendDays()) =>
    weekends.includes(new Date(`${key}T00:00:00Z`).getUTCDay())

// Holidays between two keys (inclusive) as a Map key -> name
export const holidayMap = async (fromKey, toKey_) => {
    const list = await Holiday.find({ date: { $gte: fromKey, $lte: toKey_ } })
    return new Map(list.map(h => [h.date, h.name]))
}

// Every date key from start to end (inclusive)
export const eachDayKey = (start, end) => {
    const keys = []
    const d = new Date(`${toKey(start)}T00:00:00Z`)
    const last = new Date(`${toKey(end)}T00:00:00Z`)
    while (d <= last && keys.length < 400) {        // safety cap
        keys.push(d.toISOString().slice(0, 10))
        d.setUTCDate(d.getUTCDate() + 1)
    }
    return keys
}

// Working days between start and end (inclusive): skips weekends and holidays.
// Returns { days, skipped: [{ date, reason }] }
export const countWorkingDays = async (start, end) => {
    const keys = eachDayKey(start, end)
    if (!keys.length) return { days: 0, skipped: [] }
    const holidays = await holidayMap(keys[0], keys[keys.length - 1])
    const weekends = weekendDays()
    const skipped = []
    let days = 0
    for (const k of keys) {
        if (holidays.has(k))               skipped.push({ date: k, reason: holidays.get(k) })
        else if (isWeekendKey(k, weekends)) skipped.push({ date: k, reason: 'Weekend' })
        else days++
    }
    return { days, skipped }
}

// 'YYYY-MM' of a pay date, without timezone surprises
export const monthKeyOf = (d) => toKey(d || new Date()).slice(0, 7)
