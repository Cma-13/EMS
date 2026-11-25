import Notification from '../models/Notification.js';

// Get notifications for current user based on role
const getNotifications = async (req, res) => {
    try {
        const { _id, role } = req.user;
        let query;

    if (role === 'admin') {
    // Admin sees admin notifications only, not holiday/all broadcasts
    query = { forRole: 'admin' };
        } else {
            // Employee sees only: their own notifications OR 'all' (holidays)
            query = {
                $or: [
                    { forRole: 'all' },                              // holidays - everyone
                    { forRole: 'employee', forUserId: _id }          // their own only
                ]
            };
        }

        const docs = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        let notifications, unreadCount;
        if (role === 'admin') {
            notifications = docs;
            unreadCount   = await Notification.countDocuments({ ...query, isRead: false });
        } else {
            // Broadcasts are "read" per employee, using readBy
            notifications = docs.map(n => n.forRole === 'all'
                ? { ...n, isRead: (n.readBy || []).some(id => String(id) === String(_id)) }
                : n);
            unreadCount =
                await Notification.countDocuments({ forRole: 'employee', forUserId: _id, isRead: false }) +
                await Notification.countDocuments({ forRole: 'all', readBy: { $ne: _id } });
        }

        return res.status(200).json({ success: true, notifications, unreadCount });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Mark all as read for current user
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

// Mark one as read
const markOneRead = async (req, res) => {
    try {
        const { _id, role } = req.user;
        const n = await Notification.findById(req.params.id);
        if (!n) return res.status(404).json({ success: false, error: 'Notification not found' });
        if (n.forRole === 'all') {
            await Notification.updateOne({ _id: n._id }, { $addToSet: { readBy: _id } });
        } else if ((n.forRole === 'admin' && role === 'admin') || String(n.forUserId) === String(_id)) {
            await Notification.updateOne({ _id: n._id }, { isRead: true });
        } else {
            return res.status(403).json({ success: false, error: 'Not your notification' });
        }
        return res.status(200).json({ success: true });
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

export { getNotifications, markAllRead, markOneRead };
