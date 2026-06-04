import express from 'express';
import { getCompanyWorkers, addWorker, updateWorker } from '../controllers/workforceController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';

const router = express.Router();

router.get('/', protect, authorize(['owner', 'admin']), getCompanyWorkers);
router.post('/', protect, authorize(['owner']), addWorker);
router.put('/:id', protect, authorize(['owner', 'admin']), updateWorker);

export default router;
