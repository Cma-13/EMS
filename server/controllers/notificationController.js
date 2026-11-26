import Notification from '../models/Notification.js';

// ── Helpers ──────────────────────────────────────────────
// Admin sees admin notifications. An employee sees their own notifications
// plus broadcasts (forRole 'all', e.g. holidays) they haven't deleted.
const scopeQuery = ({ _id, role }) => role === 'admin'
    ? { forRole: 'admin' }
    : {
        $or: [
            { forRole: 'all', dismissedBy: { $ne: _id } },
            { forRole: 'employee', forUserId: _id },
        ],
    };

// Broadcasts are read per employee (readBy); everything else uses isRead
const unreadQuery = ({ _id, role }) => role === 'admin'
    ? { forRole: 'admin', isRead: false }
    : {
        $or: [
            { forRole: 'all', dismissedBy: { $ne: _id }, readBy: { $ne: _id } },
            { forRole: 'employee', forUserId: _id, isRead: false },
        ],
    };

// Early-exit requests still waiting for a decision must stay — the Attendance page reads them
const isPendingAction = (n) => n.actionable && n.actionStatus === 'pending';

const canTouch = (n, { _id, role }) =>
    n.forRole === 'all' ||
    (n.forRole === 'admin' && role === 'admin') ||
    String(n.forUserId) === String(_id);

// ── GET /api/notifications?page=1&limit=20&filter=all|unread ──
const getNotifications = async (req, res) => {
    try {
        const { _id } = req.user;
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
        const query  = req.query.filter === 'unread' ? unreadQuery(req.user) : scopeQuery(req.user);

        const [docs, total, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            Notification.countDocuments(query),
            Notification.countDocuments(unreadQuery(req.user)),
        ]);

        const notifications = docs.map(n => {
            const { readBy, dismissedBy, ...rest } = n;   // don't send other people's ids to the browser
            return n.forRole === 'all'
                ? { ...rest, isRead: (readBy || []).some(id => String(id) === String(_id)) }
                : rest;
        });

        return res.status(200).json({
            success: true, notifications, unreadCount,
            total, page, pages: Math.max(1, Math.ceil(total / limit)),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ── PUT /api/notifications/read-all ──
const markAllRead = async (req, res) => {
    try {
        const { _id, role } = req.user;
        if (role === 'admin') {
            await Notification.updateMany({ forRole: 'admin' }, { isRead: true });
        } else {
            await Notification.updateMany({ forRole: 'employee', forUserId: _id }, { isRead: true });
            await Notification.updateMany({ forRole: 'all' }, { $addToSet: { readBy: _id } });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ── PUT /api/notifications/read/:id   and   PUT /api/notifications/unread/:id ──
const setReadState = (read) => async (req, res) => {
    try {
        const { _id } = req.user;
        const n = await Notification.findById(req.params.id);
        if (!n) return res.status(404).json({ success: false, error: 'Notification not found' });
        if (!canTouch(n, req.user)) return res.status(403).json({ success: false, error: 'Not your notification' });

        if (n.forRole === 'all') {
            const op = read ? { $addToSet: { readBy: _id } } : { $pull: { readBy: _id } };
            await Notification.updateOne({ _id: n._id }, op);
        } else {
            await Notification.updateOne({ _id: n._id }, { isRead: read });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
const markOneRead   = setReadState(true);
const markOneUnread = setReadState(false);

// ── DELETE /api/notifications/:id ──
const deleteNotification = async (req, res) => {
    try {
        const { _id } = req.user;
        const n = await Notification.findById(req.params.id);
        if (!n) return res.status(404).json({ success: false, error: 'Notification not found' });
        if (!canTouch(n, req.user)) return res.status(403).json({ success: false, error: 'Not your notification' });
        if (isPendingAction(n))
            return res.status(400).json({ success: false, error: 'Approve or reject this request before deleting it.' });

        if (n.forRole === 'all') {
            // A broadcast is shared — only hide it for this employee
            await Notification.updateOne({ _id: n._id }, { $addToSet: { dismissedBy: _id } });
        } else {
            await Notification.deleteOne({ _id: n._id });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ── DELETE /api/notifications/clear-read ──
const clearRead = async (req, res) => {
    try {
        const { _id, role } = req.user;
        const keepPending = { $nor: [{ actionable: true, actionStatus: 'pending' }] };
        let removed = 0;
        if (role === 'admin') {
            const r = await Notification.deleteMany({ forRole: 'admin', isRead: true, ...keepPending });
            removed = r.deletedCount;
        } else {
            const r = await Notification.deleteMany({ forRole: 'employee', forUserId: _id, isRead: true });
            const b = await Notification.updateMany(
                { forRole: 'all', readBy: _id, dismissedBy: { $ne: _id } },
                { $addToSet: { dismissedBy: _id } }
            );
            removed = r.deletedCount + b.modifiedCount;
        }
        return res.status(200).json({ success: true, removed });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Internal helper - create notification
export const createNotification = async (type, message, link = '', forRole = 'admin', forUserId = null) => {
    try {
        await Notification.create({ type, message, link, forRole, forUserId });
    } catch (e) {
        console.log('Notification error:', e.message);
    }
};

export { getNotifications, markAllRead, markOneRead, markOneUnread, deleteNotification, clearRead };
