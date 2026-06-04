import express from 'express';
import { workerLogin, workerMe } from '../controllers/workerAuthController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public — worker portal login (phone + PIN)
router.post('/login', workerLogin);

// Protected — current worker profile
router.get('/me', protect, workerMe);

export default router;
