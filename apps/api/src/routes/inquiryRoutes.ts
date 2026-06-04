import express from 'express';
import { getInquiries, updateInquiryStatus, getInquiryStats, submitInquiry, getAiInsights } from '../controllers/inquiryController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public route for submitting inquiries from directory
router.post('/submit', submitInquiry);

// Protected routes
router.use(protect); 
router.get('/', getInquiries);
router.get('/stats', getInquiryStats);
router.get('/ai-insights', getAiInsights);
router.put('/:id/status', updateInquiryStatus);

export default router;