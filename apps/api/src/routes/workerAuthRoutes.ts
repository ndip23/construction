import express from 'express';
import { workerLogin, workerMe } from '../controllers/workerAuthController';
import { protect } from '../middleware/auth';
import { authRateLimiter } from '../middleware/authRateLimit';

const router = express.Router();

// Public — worker portal login (phone + PIN). Rate-limited: a 4-digit PIN has
// only 10k combinations and is trivially brute-forced without a throttle.
router.post('/login', authRateLimiter, workerLogin);

// Protected — current worker profile
router.get('/me', protect, workerMe);

export default router;
