import express from 'express';
import { 
  getAllTenders, 
  getTenderBySlug, 
  createTender, 
  createPublicTender,
  submitProposal
} from '../controllers/tenderController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';
import { publicWriteLimiter } from '../middleware/authRateLimit';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.get('/', getAllTenders);
router.post('/public', publicWriteLimiter, createPublicTender);
router.get('/:slug', getTenderBySlug);

// --- PROTECTED ROUTES ---
router.use(protect);

// Anyone with a company ID (Owner/Staff) can post a job
router.post('/', authorize(['owner', 'admin']), createTender);
router.post('/:id/proposals', protect, submitProposal);

// Only Contractors/Builders can bid on jobs


export default router;