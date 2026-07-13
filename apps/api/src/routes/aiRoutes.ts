import express from 'express';
import { askAssistant, generateEstimate } from '../controllers/aiController';
import { protect } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/aiRateLimit';

const router = express.Router();

router.post('/chat', protect, aiRateLimiter, askAssistant);
router.post('/estimate', aiRateLimiter, generateEstimate);

export default router;