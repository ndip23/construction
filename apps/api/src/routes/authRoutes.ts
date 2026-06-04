import express from 'express';
import rateLimit from 'express-rate-limit';
// 1. Import your named exports from the controller
import { register, login, getSummary, getFinanceInsights, getCompanyBySlug, getMyCompanyProfile, updateCompanyBySlug,
updateCompanyPortfolio, updateCompanyLogo, deleteCompanyPortfolioImage, updateMyCompanyProfile, forgotPassword, resetPassword, updateCompanyLetterhead } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { handleUpload } from '../middleware/handleUpload';

const router = express.Router();

// Strict Rate Limiting for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { message: "Too many login attempts from this IP, please try again after 15 minutes to protect your account." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Atomic registration (Creates Owner + Company Profile)
 * @access  Public
 */
router.post('/register', authLimiter, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login and return JWT token + User/Company metadata
 * @access  Public
 */
router.post('/login', authLimiter, login);

/**
 * @route   GET /api/v1/auth/company/summary
 * @desc    Get dashboard summary stats for the company
 * @access  Private
 */
router.get('/company/summary', protect, getSummary);
router.get('/company/finance-insights', protect, getFinanceInsights);

/**
 * @route   PUT /api/v1/auth/company/:id
 * @desc    Update company business profile
 * @access  Private
 */
router.get('/company/profile', protect, getMyCompanyProfile);
router.put('/company/profile', protect, updateMyCompanyProfile);
router.get('/company/:slug', protect, getCompanyBySlug);
router.put('/company/:slug', protect, updateCompanyBySlug);
router.post('/company/:slug/logo', protect, handleUpload(upload.single('file')), updateCompanyLogo);
router.post('/company/:slug/letterhead', protect, handleUpload(upload.single('file')), updateCompanyLetterhead);
router.post('/company/:slug/gallery', protect, handleUpload(upload.array('files', 10)), updateCompanyPortfolio);
router.delete('/company/:slug/gallery', protect, deleteCompanyPortfolioImage);

export default router;