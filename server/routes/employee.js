import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
import { addEmployee, upload, getEmployees, getEmployee, updateEmployee, fetchEmployeesByDepId, deleteEmployee } from '../controllers/employeeController.js';

const router = express.Router()

// Run multer and turn its errors (wrong file type, too big) into a clear 400 message
const uploadImage = (req, res, next) =>
    upload.single('image')(req, res, (err) => {
        if (!err) return next()
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5 MB.' : err.message
        return res.status(400).json({ success: false, error: msg })
    })

router.get('/', authMiddleware, verifyAdmin, getEmployees)
router.post('/add', authMiddleware, verifyAdmin, uploadImage, addEmployee)
router.get('/department/:id', authMiddleware, verifyAdmin, fetchEmployeesByDepId)
router.get('/:id', authMiddleware, getEmployee)
router.put('/:id', authMiddleware, verifyAdmin, updateEmployee)
router.delete('/:id', authMiddleware, verifyAdmin, deleteEmployee)
export default router
