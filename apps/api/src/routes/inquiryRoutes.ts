import express from 'express';
import { protect } from '../middleware/auth';
import {
  createPublicInquiry,
  getCompanyInquiries,
  updateInquiryStatus,
} from '../controllers/inquiryController';

const router = express.Router();

router.post('/public', createPublicInquiry);

router.use(protect);

router.get('/', getCompanyInquiries);
router.put('/:id/status', updateInquiryStatus);

export default router;
