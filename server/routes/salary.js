import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
import { addSalary, getSalary, previewDeductions } from '../controllers/salaryController.js';

const router = express.Router()

router.post('/add',authMiddleware,verifyAdmin,addSalary)
router.get('/preview/:employeeId',authMiddleware,verifyAdmin,previewDeductions)   // must stay above '/:id/:role'
router.get('/:id/:role',authMiddleware,getSalary)


export default router