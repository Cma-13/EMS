// Automated checks for the leave and payroll rules.
// Run from the server folder with:  npm test
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
    toLocalDay, noticeDaysUntil, isWeekendKey, workingDaysIn,
    splitPaidUnpaid, deductionFor, countableAbsents, netSalary,
} from '../utils/hrRules.js'
import { eachDayKey, toKey, monthKeyOf } from '../utils/workdays.js'

const SAT = [6]                     // the office weekend (WEEKEND_DAYS=6)
const noHolidays = new Map()
const days = (from, to, holidays = noHolidays, weekends = SAT) =>
    workingDaysIn(eachDayKey(from, to), holidays, weekends)

describe('Dates', () => {
    test('a YYYY-MM-DD string is read as a local date, not UTC', () => {
        const d = toLocalDay('2026-11-25')
        assert.equal(d.getFullYear(), 2026)
        assert.equal(d.getMonth(), 10)        // November (0-based)
        assert.equal(d.getDate(), 25)
        assert.equal(d.getHours(), 0)
    })

    test('lists every day in a range, across a month end', () => {
        assert.deepEqual(eachDayKey('2026-11-29', '2026-12-02'),
            ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02'])
    })

    test('turns dates into keys and months', () => {
        assert.equal(toKey('2026-12-10'), '2026-12-10')
        assert.equal(toKey(new Date('2026-12-10')), '2026-12-10')
        assert.equal(monthKeyOf('2026-12-15'), '2026-12')
    })

    test('knows which days are the weekend', () => {
        assert.equal(isWeekendKey('2026-11-28', SAT), true)    // Saturday
        assert.equal(isWeekendKey('2026-11-27', SAT), false)   // Friday
        assert.equal(isWeekendKey('2026-11-29', [6, 0]), true) // Sunday, when Sat+Sun are off
    })
})

describe('Notice period', () => {
    const now = new Date(2026, 10, 25, 20, 30)   // Wed 25 Nov 2026, 8:30 PM local time

    test('leave starting today has 0 days notice', () => {
        assert.equal(noticeDaysUntil('2026-11-25', now), 0)
    })
    test('leave starting tomorrow has 1 day notice (enough for Casual Leave)', () => {
        assert.equal(noticeDaysUntil('2026-11-26', now), 1)
    })
    test('6 days ahead is NOT enough for Annual Leave (needs 7)', () => {
        assert.ok(noticeDaysUntil('2026-12-01', now) < 7)
    })
    test('7 days ahead is enough for Annual Leave', () => {
        assert.equal(noticeDaysUntil('2026-12-02', now), 7)
    })
})

describe('Leave counts working days only', () => {
    test('Friday to Sunday is 2 days when Saturday is off', () => {
        const r = days('2026-12-04', '2026-12-06')
        assert.equal(r.days, 2)
        assert.deepEqual(r.skipped, [{ date: '2026-12-05', reason: 'Weekend' }])
    })
    test('Saturday alone is 0 days (no leave needed)', () => {
        assert.equal(days('2026-12-05', '2026-12-05').days, 0)
    })
    test('Monday to Saturday is 5 days, so it fits the Annual Leave limit of 5', () => {
        assert.equal(days('2026-12-14', '2026-12-19').days, 5)
    })
    test('a declared holiday inside the leave is not counted', () => {
        const holidays = new Map([['2026-12-16', 'Office Holiday']])
        const r = days('2026-12-14', '2026-12-18', holidays)
        assert.equal(r.days, 4)
        assert.deepEqual(r.skipped, [{ date: '2026-12-16', reason: 'Office Holiday' }])
    })
    test('a holiday on a Saturday is only skipped once', () => {
        const holidays = new Map([['2026-12-19', 'Festival']])
        assert.equal(days('2026-12-18', '2026-12-20', holidays).days, 2)
    })
})

describe('Paid and unpaid leave days', () => {
    test('all paid when the balance covers the leave', () => {
        assert.deepEqual(splitPaidUnpaid(3, 10), { paidDays: 3, unpaidDays: 0 })
    })
    test('extra days beyond the balance become unpaid', () => {
        assert.deepEqual(splitPaidUnpaid(5, 2), { paidDays: 2, unpaidDays: 3 })
    })
    test('everything unpaid when the balance is used up', () => {
        assert.deepEqual(splitPaidUnpaid(2, 0), { paidDays: 0, unpaidDays: 2 })
    })
    test('a negative balance never creates negative paid days', () => {
        assert.deepEqual(splitPaidUnpaid(2, -1), { paidDays: 0, unpaidDays: 2 })
    })
})

describe('Salary deductions', () => {
    test('one day = monthly salary / 26', () => {
        assert.equal(deductionFor(26000, 1), 1000)
        assert.equal(deductionFor(26000, 2), 2000)
    })
    test('amounts are rounded to whole rupees', () => {
        assert.equal(deductionFor(30000, 2), 2308)    // 30000 / 26 * 2 = 2307.69
        assert.equal(deductionFor(30000, 3), 3462)
    })
    test('no salary means no deduction', () => {
        assert.equal(deductionFor(undefined, 3), 0)
    })

    test('absent days on weekends, holidays or approved leave are never deducted', () => {
        const absents = [
            { date: '2026-11-02' },   // Monday           -> counted
            { date: '2026-11-03' },   // Tuesday          -> counted
            { date: '2026-11-07' },   // Saturday         -> weekend
            { date: '2026-11-09' },   // Monday, holiday  -> skipped
            { date: '2026-11-10' },   // on approved leave -> skipped
        ]
        const counted = countableAbsents(absents, {
            holidays:    new Map([['2026-11-09', 'Festival']]),
            weekends:    SAT,
            leaveRanges: [{ start: '2026-11-10', end: '2026-11-11' }],
        })
        assert.deepEqual(counted.map(a => a.date), ['2026-11-02', '2026-11-03'])
    })

    test('net salary = basic + allowances - other - unpaid leave - absent days', () => {
        // Rs. 26,000 + 2,000 allowance - 500 other - 2,000 for 2 absent days
        assert.equal(netSalary({ basic: 26000, allowances: 2000, other: 500, absentDeduction: 2000 }), 25500)
        // Rs. 30,000 + 1,000 - 500 - 2,308 unpaid leave
        assert.equal(netSalary({ basic: 30000, allowances: 1000, other: 500, leaveDeduction: 2308 }), 28192)
    })
})
