import express from 'express';
import { getHolidays, addHoliday, deleteHoliday } from '../controllers/holidayController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
const router = express.Router();
router.get('/', authMiddleware, getHolidays);
router.post('/add', authMiddleware, verifyAdmin, addHoliday);
router.delete('/:id', authMiddleware, verifyAdmin, deleteHoliday);
export default router;
