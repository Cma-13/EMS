// Number of leave days to show for a leave.
// New leaves store working days (weekends and holidays not counted) in \`days\`.
// Older leaves don't have it, so fall back to the calendar-day count they were created with.
export const leaveDays = (l) =>
    l?.days ?? (l ? Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1 : 0)
