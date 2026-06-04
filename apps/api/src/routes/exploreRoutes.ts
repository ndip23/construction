import express from 'express';
import { getCompanies, getPublicProfile, getCompanyBySlug, trackDirectoryActivity } from '../controllers/exploreController';

const router = express.Router();

/**
 * These routes are PUBLIC. 
 * They do NOT use the 'protect' middleware because visitors need to see them.
 */

// Matches: /api/v1/explore/companies
router.get('/companies', getCompanies);

// Matches: /api/v1/explore/company/vertex-builders-douala
router.get('/company/:slug', getPublicProfile);
router.get('/company/:slug/preview', getCompanyBySlug);

// Matches: /api/v1/explore/track
router.post('/track', trackDirectoryActivity);

export default router;