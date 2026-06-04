import express from 'express';
import { 
  getProducts, 
  getProductById,
  createOrder, 
  getOrders, 
  getMarketplaceStats, 
  addProduct,
  getMyProducts,
  updateProduct,
  deleteProduct
} from '../controllers/marketplaceController';
import { getSupplierIntelligence } from '../controllers/marketplaceIntelligenceController';
import { trackActivity, generateMockTraffic } from '../controllers/activityController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/roleCheck';
import { publicWriteLimiter } from '../middleware/authRateLimit';
import { upload } from '../middleware/upload';

const router = express.Router();

// Public: Browse & Track
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/track', publicWriteLimiter, trackActivity);

// Protected: Orders & Stats
router.use(protect); // All routes below require login
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.get('/stats', getMarketplaceStats);

// Protected: AI Intelligence
router.get('/intelligence/supplier', getSupplierIntelligence);
router.post('/mock-traffic', generateMockTraffic);

// Protected: Catalog management
router.get('/my-products', getMyProducts);
router.post('/products', upload.single('image'), addProduct);
router.put('/products/:id', upload.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;