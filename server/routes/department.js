import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import verifyAdmin from '../middleware/adminMiddleware.js'
import { addDepartment, getDepartments, getDepartment,updateDepartment,deleteDepartment } from '../controllers/departmentController.js';


const router = express.Router()

router.get('/',authMiddleware,getDepartments)
router.post('/add',authMiddleware,verifyAdmin,addDepartment)
router.get('/:id',authMiddleware,getDepartment)
router.put('/:id',authMiddleware,verifyAdmin,updateDepartment)
router.delete('/:id',authMiddleware,verifyAdmin,deleteDepartment)

export default router