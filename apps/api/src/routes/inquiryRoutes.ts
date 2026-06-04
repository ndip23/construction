import express from 'express';
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 7d1c33eea5ac569aa87505e32ff265b2b6d88d3c
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

<<<<<<< HEAD
export default router;
=======
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
>>>>>>> main
=======
export default router;
>>>>>>> 7d1c33eea5ac569aa87505e32ff265b2b6d88d3c
