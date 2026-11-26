import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBell, FaCheckDouble, FaTrash, FaEnvelopeOpen, FaEnvelope, FaTimes } from 'react-icons/fa'
import { useAuth } from '../../context/authContext'
import ConfirmModal from '../ConfirmModal'
import { showAlert } from '../AlertPopup'
import {
    iconFor, timeAgo, groupByDay, resolveLink, isPendingAction,
    notifApi, NOTIF_EVENT, notifyChanged,
} from './notificationShared'

const PAGE_SIZE = 20

// Full "View all notifications" page (admin and employee)
const NotificationsPage = () => {
    const { user }  = useAuth()
    const navigate  = useNavigate()
    const [tab, setTab]           = useState('all')     // 'all' | 'unread'
    const [items, setItems]       = useState([])
    const [page, setPage]         = useState(1)
    const [pages, setPages]       = useState(1)
    const [total, setTotal]       = useState(0)
    const [unread, setUnread]     = useState(0)
    const [loading, setLoading]   = useState(true)
    const [confirmClear, setConfirmClear] = useState(false)

    // Reload everything shown so far (keeps "Load more" pages after an action)
    const load = useCallback(async (upToPage = 1) => {
        try {
            const data = await notifApi.list({ page: 1, limit: PAGE_SIZE * upToPage, filter: tab })
            if (data.success) {
                setItems(data.notifications); setTotal(data.total); setUnread(data.unreadCount)
                setPage(upToPage); setPages(Math.max(1, Math.ceil(data.total / PAGE_SIZE)))
            }
        } catch { showAlert('Could not load notifications.') }
        setLoading(false)
    }, [tab])

    useEffect(() => { setLoading(true); load(1) }, [load])

    // Stay in sync when the bell dropdown changes something
    useEffect(() => {
        const sync = () => load(page)
        window.addEventListener(NOTIF_EVENT, sync)
        return () => window.removeEventListener(NOTIF_EVENT, sync)
    }, [load, page])

    const run = async (fn, errMsg) => {
        try { await fn(); notifyChanged() }
        catch (err) { showAlert(err.response?.data?.error || errMsg) }
    }

    const openItem = async (n) => {
        if (!n.isRead) await run(() => notifApi.markRead(n._id), 'Could not update notification.')
        const link = resolveLink(n, user)
        if (link) navigate(link)
    }

    const toggleRead = (e, n) => {
        e.stopPropagation()
        run(() => n.isRead ? notifApi.markUnread(n._id) : notifApi.markRead(n._id), 'Could not update notification.')
    }

    const removeOne = (e, n) => {
        e.stopPropagation()
        run(() => notifApi.remove(n._id), 'Could not delete notification.')
    }

    const markAll = () => run(() => notifApi.markAll(), 'Could not mark all as read.')

    const clearRead = async () => {
        setConfirmClear(false)
        try {
            const data = await notifApi.clearRead()
            notifyChanged()
            showAlert(data.removed ? `Removed ${data.removed} read notification${data.removed > 1 ? 's' : ''}.` : 'There were no read notifications to clear.', 'Done')
        } catch (err) { showAlert(err.response?.data?.error || 'Could not clear notifications.') }
    }

    return (
        <div className="p-6 bg-stone-50 min-h-full">
            <ConfirmModal
                isOpen={confirmClear}
                title="Clear read notifications?"
                message="All notifications you've already read will be removed. Unread ones stay."
                confirmText="Clear"
                onConfirm={clearRead}
                onCancel={() => setConfirmClear(false)}
            />

            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                            <FaBell className="text-teal-600" /> Notifications
                        </h1>
                        <p className="text-xs text-stone-500 mt-0.5">
                            {unread > 0 ? `${unread} unread` : 'All caught up'} · {total} {tab === 'unread' ? 'unread' : 'total'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={markAll} disabled={unread === 0}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white disabled:bg-stone-200 disabled:text-stone-400 transition">
                            <FaCheckDouble /> Mark all as read
                        </button>
                        <button onClick={() => setConfirmClear(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
                            <FaTrash /> Clear read
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-white border border-stone-200 rounded-xl p-1 w-fit">
                    {['all', 'unread'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${tab === t ? 'bg-teal-600 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
                            {t}{t === 'unread' && unread > 0 ? ` (${unread})` : ''}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <p className="text-center py-12 text-sm text-stone-400">Loading...</p>
                    ) : items.length === 0 ? (
                        <div className="text-center py-14 text-stone-400">
                            <FaBell className="text-4xl mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">{tab === 'unread' ? "You're all caught up!" : 'No notifications yet'}</p>
                        </div>
                    ) : groupByDay(items).map(([label, group]) => (
                        <div key={label}>
                            <p className="px-5 pt-4 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50/60">{label}</p>
                            {group.map(n => {
                                const meta = iconFor(n.type)
                                return (
                                    <div key={n._id} onClick={() => openItem(n)}
                                        className={`group flex items-start gap-4 px-5 py-4 border-b border-stone-100 last:border-0 cursor-pointer transition ${!n.isRead ? 'bg-teal-50/60' : 'bg-white'} hover:bg-stone-50`}>
                                        <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{meta.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-relaxed ${!n.isRead ? 'font-semibold text-stone-800' : 'text-stone-600'}`}>{n.message}</p>
                                            <p className="text-xs text-stone-400 mt-1">
                                                {timeAgo(n.createdAt)}
                                                {isPendingAction(n) && <span className="ml-2 text-amber-600 font-semibold">• Needs your action</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                            <button onClick={(e) => toggleRead(e, n)} title={n.isRead ? 'Mark as unread' : 'Mark as read'}
                                                className="p-2 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-teal-50">
                                                {n.isRead ? <FaEnvelope className="text-xs" /> : <FaEnvelopeOpen className="text-xs" />}
                                            </button>
                                            {!isPendingAction(n) && (
                                                <button onClick={(e) => removeOne(e, n)} title="Delete"
                                                    className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50">
                                                    <FaTimes className="text-xs" />
                                                </button>
                                            )}
                                        </div>
                                        {!n.isRead && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0 mt-2"></div>}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* Load more */}
                {!loading && page < pages && (
                    <div className="text-center mt-4">
                        <button onClick={() => load(page + 1)}
                            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 transition">
                            Load more ({total - items.length} older)
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationsPage
