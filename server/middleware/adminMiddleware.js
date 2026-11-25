// Allows the request only if the logged-in user is an admin.
// Use it after authMiddleware, which sets req.user.
const verifyAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can do this.' });
    }
    next();
};

export default verifyAdmin;
