import express from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';
import {
  getOverview, listCompanies, suspendCompany, updateCompanyPlan, adjustWallet,
  listUsers, updateUserRole, getFinance, getAuditLogs,
} from '../controllers/superAdminController';

const router = express.Router();

// Every route here is platform-owner only. authorize() lets 'superadmin' pass
// implicitly; we still name it explicitly for clarity and defense-in-depth.
router.use(protect, authorize(['superadmin']));

router.get('/overview', getOverview);

router.get('/companies', listCompanies);
router.patch('/companies/:id/suspend', suspendCompany);
router.patch('/companies/:id/plan', updateCompanyPlan);
router.patch('/companies/:id/wallet', adjustWallet);

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);

router.get('/finance', getFinance);
router.get('/audit', getAuditLogs);

export default router;
