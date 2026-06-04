import express from 'express';
import {
  runPayroll,
  getPayslips,
  markPaid,
  getPayslip
} from '../controllers/payrollController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';

const router = express.Router();

router.use(protect);

router.get('/', getPayslips);
router.post('/run', authorize(['owner', 'admin']), runPayroll);
router.put('/:id/pay', authorize(['owner', 'admin']), markPaid);
router.get('/:id', getPayslip);

export default router;
