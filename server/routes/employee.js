import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
import { addEmployee, upload, getEmployees, getEmployee, updateEmployee, fetchEmployeesByDepId, deleteEmployee } from '../controllers/employeeController.js';

const router = express.Router()
router.get('/', authMiddleware, verifyAdmin, getEmployees)
router.post('/add', authMiddleware, verifyAdmin, upload.single('image'), addEmployee)
router.get('/department/:id', authMiddleware, verifyAdmin, fetchEmployeesByDepId)
router.get('/:id', authMiddleware, getEmployee)
router.put('/:id', authMiddleware, verifyAdmin, updateEmployee)
router.delete('/:id', authMiddleware, verifyAdmin, deleteEmployee)
export default router
