import express from 'express';
import { markAttendance, markCheckout, handleEarlyExitRequest, notifyEarlyExit, runDailyAbsentCheck, getEmployeeAttendance, getDailyAttendance, getMonthlyAttendance } from '../controllers/attendanceController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
import verifyServiceKey from '../middleware/serviceKeyMiddleware.js'

const router = express.Router();

router.post('/mark',                  authMiddleware, verifyAdmin, markAttendance)   // manual marking — admin only
router.post('/checkout',              authMiddleware, verifyAdmin, markCheckout)     // manual checkout — admin only
router.post('/early-exit-action',     authMiddleware, verifyAdmin, handleEarlyExitRequest)  // admin approve/reject
router.post('/notify-early-exit',     verifyServiceKey, notifyEarlyExit)  // called by face service with X-Service-Key
router.post('/run-absent-check',      authMiddleware, verifyAdmin, runDailyAbsentCheck)
router.get('/employee/:userId',       authMiddleware, getEmployeeAttendance)
router.get('/daily/:date',            getDailyAttendance)  // public — office attendance page
router.get('/monthly/:year/:month',   authMiddleware, verifyAdmin, getMonthlyAttendance)

export default router;
