import express from 'express';
import {
  clockIn,
  clockOut,
  getAttendance,
  getTimesheet,
} from '../controllers/attendanceController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/timesheet', getTimesheet);
router.get('/', getAttendance);

export default router;
