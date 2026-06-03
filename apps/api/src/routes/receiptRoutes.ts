import express from 'express';
import { 
  createReceipt, 
  getReceipts, 
  getReceiptById,
  deleteReceipt,
  sendReceiptEmail,
  parseReceiptAI,
  getRecentClients
} from '../controllers/receiptController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createReceipt)
  .get(getReceipts);

router.get('/clients/recent', getRecentClients);
router.post('/ai-parse', parseReceiptAI);

router.route('/:id')
  .get(getReceiptById)
  .delete(deleteReceipt);

router.post('/:id/email', sendReceiptEmail);

export default router;
