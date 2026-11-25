import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
import { getSummary, getSalaryBreakdown, getAllSalaries } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/summary',          authMiddleware, verifyAdmin, getSummary)
router.get('/salary-breakdown', authMiddleware, verifyAdmin, getSalaryBreakdown)
router.get('/salary-all', authMiddleware, verifyAdmin, getAllSalaries)

export default router;
