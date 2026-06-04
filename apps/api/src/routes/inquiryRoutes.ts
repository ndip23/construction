import express from 'express';
import { protect } from '../middleware/auth';
import { publicWriteLimiter } from '../middleware/authRateLimit';
import {
  submitInquiry,
  getInquiries,
  updateInquiryStatus,
  getInquiryStats,
  getAiInsights
} from '../controllers/inquiryController';

const router = express.Router();

router.post('/submit', publicWriteLimiter, submitInquiry);

router.use(protect);

router.get('/', getInquiries);
router.get('/stats', getInquiryStats);
router.get('/ai-insights', getAiInsights);
router.put('/:id/status', updateInquiryStatus);

export default router;
