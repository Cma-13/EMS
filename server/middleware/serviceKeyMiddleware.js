// Allows a request only if it carries the shared face-service key.
// Used for internal calls made by the Python face service.
// FACE_SERVICE_KEY in server/.env must match the one in face_service/.env.
const verifyServiceKey = (req, res, next) => {
    const expected = process.env.FACE_SERVICE_KEY || 'ems-face-secret-2024';
    if (req.headers['x-service-key'] !== expected) {
        return res.status(403).json({ success: false, error: 'Invalid service key.' });
    }
    next();
};

export default verifyServiceKey;
