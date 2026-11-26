import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/authContext'
import { useNavigate } from 'react-router-dom'
import { FaBell, FaSignOutAlt, FaCheckDouble, FaTimes, FaCheck } from 'react-icons/fa'
import { API_BASE } from '../../utils/apiConfig'
import {
    iconFor, timeAgo, groupByDay, resolveLink, isPendingAction,
    notifApi, NOTIF_EVENT, notifyChanged,
} from '../notifications/notificationShared'

const Navbar = () => {
    const { user, logout }  = useAuth()
    const navigate          = useNavigate()
    const [open, setOpen]   = useState(false)
    const [tab, setTab]     = useState('all')          // 'all' | 'unread'
    const [notifications, setNotifications] = useState([])
    const [unread, setUnread]   = useState(0)
    const [imgError, setImgError] = useState(false)
    const dropRef = useRef(null)

    const basePath = user?.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard'

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await notifApi.list({ limit: 10, filter: tab })
            if (data.success) { setNotifications(data.notifications); setUnread(data.unreadCount) }
        } catch {}
    }, [tab])

    // Load now, then every 15 seconds, and whenever the Notifications page changes something
    useEffect(() => {
        fetchNotifications()
        const poll = setInterval(fetchNotifications, 15000)
        window.addEventListener(NOTIF_EVENT, fetchNotifications)
        return () => { clearInterval(poll); window.removeEventListener(NOTIF_EVENT, fetchNotifications) }
    }, [fetchNotifications])

    useEffect(() => {
        const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Opening the bell no longer marks everything as read — only what you click
    const handleNotifClick = async (n) => {
        if (!n.isRead) { try { await notifApi.markRead(n._id); notifyChanged() } catch {} }
        const link = resolveLink(n, user)
        if (link) navigate(link)
        setOpen(false)
    }

    const markOne = async (e, n) => {
        e.stopPropagation()
        try { await notifApi.markRead(n._id); notifyChanged() } catch {}
    }

    const removeOne = async (e, n) => {
        e.stopPropagation()
        try { await notifApi.remove(n._id); notifyChanged() } catch {}
    }

    const markAll = async () => {
        try { await notifApi.markAll(); notifyChanged() } catch {}
    }

    const viewAll = () => { setOpen(false); navigate(`${basePath}/notifications`) }

    const handleLogout = () => { logout(); navigate('/login') }

    const photoUrl   = user?.profileImage ? `${API_BASE}/${user.profileImage}` : null
    const avatarUrl  = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0f766e&color=fff&size=36&rounded=true&bold=true`

    return (
        <div className="flex items-center justify-between h-14 px-6 bg-white border-b border-stone-200 shadow-sm sticky top-0 z-20">
            <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Welcome back</p>
                <p className="text-stone-800 font-bold text-sm leading-tight">{user?.name}</p>
            </div>

            <div className="flex items-center gap-3">
                {/* Bell */}
                <div className="relative" ref={dropRef}>
                    <button onClick={() => setOpen(o => !o)} title="Notifications"
                        className="relative p-2.5 rounded-xl hover:bg-stone-100 transition text-stone-500">
                        <FaBell className="text-base" />
                        {unread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 leading-none">
                                {unread > 9 ? '9+' : unread}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden">
                            {/* Header */}
                            <div className="px-4 pt-3 pb-2 border-b border-stone-100 bg-stone-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                                        Notifications
                                        {unread > 0 && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">{unread} new</span>}
                                    </h3>
                                    <button onClick={markAll} disabled={unread === 0}
                                        className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 disabled:text-stone-300 disabled:cursor-default transition">
                                        <FaCheckDouble /> Mark all as read
                                    </button>
                                </div>
                                {/* Tabs */}
                                <div className="flex gap-1 mt-2">
                                    {['all', 'unread'].map(t => (
                                        <button key={t} onClick={() => setTab(t)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${tab === t ? 'bg-teal-600 text-white' : 'text-stone-500 hover:bg-stone-200'}`}>
                                            {t}{t === 'unread' && unread > 0 ? ` (${unread})` : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-10 text-stone-400">
                                        <FaBell className="text-3xl mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-medium">{tab === 'unread' ? "You're all caught up!" : 'No notifications yet'}</p>
                                    </div>
                                ) : groupByDay(notifications).map(([label, items]) => (
                                    <div key={label}>
                                        <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
                                        {items.map(n => {
                                            const meta = iconFor(n.type)
                                            return (
                                                <div key={n._id} onClick={() => handleNotifClick(n)}
                                                    className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition ${!n.isRead ? 'bg-teal-50/70' : 'bg-white'} hover:bg-stone-50`}>
                                                    <div className={`w-8 h-8 ${meta.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>{meta.icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs leading-relaxed ${!n.isRead ? 'font-semibold text-stone-800' : 'text-stone-600'}`}>{n.message}</p>
                                                        <p className="text-[10px] text-stone-400 mt-0.5">
                                                            {timeAgo(n.createdAt)}
                                                            {isPendingAction(n) && <span className="ml-2 text-amber-600 font-semibold">• Needs your action</span>}
                                                        </p>
                                                    </div>
                                                    {/* Hover actions */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                        {!n.isRead && (
                                                            <button onClick={(e) => markOne(e, n)} title="Mark as read"
                                                                className="p-1.5 rounded-md text-stone-400 hover:text-teal-600 hover:bg-teal-50"><FaCheck className="text-[10px]" /></button>
                                                        )}
                                                        {!isPendingAction(n) && (
                                                            <button onClick={(e) => removeOne(e, n)} title="Delete"
                                                                className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50"><FaTimes className="text-[10px]" /></button>
                                                        )}
                                                    </div>
                                                    {!n.isRead && <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2 group-hover:hidden"></div>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <button onClick={viewAll}
                                className="w-full px-4 py-2.5 bg-stone-50 border-t border-stone-100 text-center text-xs font-semibold text-teal-700 hover:bg-teal-50 transition">
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>

                {/* User chip: photo + name + role */}
                <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl">
                    {photoUrl && !imgError ? (
                        <img src={photoUrl} alt={user?.name} onError={() => setImgError(true)}
                            className="w-7 h-7 rounded-lg object-cover border border-stone-200 flex-shrink-0" />
                    ) : (
                        <img src={avatarUrl} alt={user?.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="leading-none">
                        <p className="text-stone-800 text-xs font-bold truncate max-w-[120px]">{user?.name}</p>
                        <p className="text-stone-400 text-[10px] capitalize mt-0.5">{user?.role}</p>
                    </div>
                </div>

                <button onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition border border-red-100">
                    <FaSignOutAlt /><span>Logout</span>
                </button>
            </div>
        </div>
    )
}
export default Navbar
