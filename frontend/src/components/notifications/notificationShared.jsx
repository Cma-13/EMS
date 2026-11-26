import React from 'react'
import axios from 'axios'
import {
    FaBell, FaCalendarCheck, FaCalendarTimes, FaUmbrellaBeach, FaUserClock,
    FaRunning, FaCheckCircle, FaTimesCircle, FaMoneyBillWave,
} from 'react-icons/fa'
import { API_BASE } from '../../utils/apiConfig'

// Shared by the bell dropdown (Navbar) and the full Notifications page

export const iconMap = {
    leave_applied:       { icon: <FaCalendarCheck className="text-teal-500" />,   bg: 'bg-teal-50'    },
    leave_approved:      { icon: <FaCalendarCheck className="text-emerald-500" />, bg: 'bg-emerald-50' },
    leave_rejected:      { icon: <FaCalendarTimes className="text-red-500" />,     bg: 'bg-red-50'     },
    holiday_declared:    { icon: <FaUmbrellaBeach className="text-amber-500" />,   bg: 'bg-amber-50'   },
    attendance_absent:   { icon: <FaUserClock className="text-orange-500" />,      bg: 'bg-orange-50'  },
    early_exit_request:  { icon: <FaRunning className="text-amber-500" />,         bg: 'bg-amber-50'   },
    early_exit_approved: { icon: <FaCheckCircle className="text-emerald-500" />,   bg: 'bg-emerald-50' },
    early_exit_rejected: { icon: <FaTimesCircle className="text-red-500" />,       bg: 'bg-red-50'     },
    salary_paid:         { icon: <FaMoneyBillWave className="text-emerald-600" />, bg: 'bg-emerald-50' },
}
export const iconFor = (type) => iconMap[type] || { icon: <FaBell className="text-stone-400" />, bg: 'bg-stone-50' }

export const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60)     return 'just now'
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Split a list into Today / Yesterday / Earlier sections
export const groupByDay = (list) => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const yesterday = new Date(start); yesterday.setDate(start.getDate() - 1)
    const groups = { Today: [], Yesterday: [], Earlier: [] }
    list.forEach(n => {
        const d = new Date(n.createdAt)
        if (d >= start) groups.Today.push(n)
        else if (d >= yesterday) groups.Yesterday.push(n)
        else groups.Earlier.push(n)
    })
    return Object.entries(groups).filter(([, items]) => items.length)
}

// Older salary notifications were saved without the user id
export const resolveLink = (n, user) =>
    n.link === '/employee-dashboard/salary' ? `/employee-dashboard/salary/${user?._id}` : n.link

// Early-exit requests waiting for a decision can't be deleted
export const isPendingAction = (n) => n.actionable && n.actionStatus === 'pending'

// ── API calls ──
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
const base = `${API_BASE}/api/notifications`

export const notifApi = {
    list:       (params)  => axios.get(base, { ...auth(), params }).then(r => r.data),
    markRead:   (id)      => axios.put(`${base}/read/${id}`, {}, auth()),
    markUnread: (id)      => axios.put(`${base}/unread/${id}`, {}, auth()),
    markAll:    ()        => axios.put(`${base}/read-all`, {}, auth()),
    remove:     (id)      => axios.delete(`${base}/${id}`, auth()),
    clearRead:  ()        => axios.delete(`${base}/clear-read`, auth()).then(r => r.data),
}

// Lets the bell and the Notifications page refresh each other after a change
export const NOTIF_EVENT = 'ems-notifications-changed'
export const notifyChanged = () => window.dispatchEvent(new Event(NOTIF_EVENT))
