import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
import { changePassword, saveEmailConfig, getEmailConfig, testEmailConfig } from '../controllers/settingController.js';

const router = express.Router()

router.put('/change-password',  authMiddleware, changePassword)
router.post('/email-config',    authMiddleware, verifyAdmin, saveEmailConfig)
router.get('/email-config',     authMiddleware, verifyAdmin, getEmailConfig)
router.post('/test-email',      authMiddleware, verifyAdmin, testEmailConfig)

export default router
