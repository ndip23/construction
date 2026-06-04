import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// 1. ROUTE IMPORTS
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/ProjectRoutes'; // Ensure your filename is 'ProjectRoutes.ts'
import invoiceRoutes from './routes/invoiceRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import workforceRoutes from './routes/workforceRoutes';
import boqRoutes from './routes/boqRoutes';
import tenderRoutes from './routes/tenderRoutes';
import messageRoutes from './routes/messageRoutes';
import adminRoutes from './routes/adminRoutes';
import exploreRoutes from './routes/exploreRoutes';
import inquiryRoutes from './routes/inquiryRoutes';
import documentRoutes from './routes/documentRoutes';
import aiRoutes from './routes/aiRoutes'; 
import serviceRoutes from './routes/serviceRoutes';
import walletRoutes from './routes/walletRoutes';
import fxRoutes from './routes/fxRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import opportunityRoutes from './routes/opportunityRoutes';
<<<<<<< HEAD
import receiptRoutes from './routes/receiptRoutes';
import inquiryRoutes from './routes/inquiryRoutes';
import communityRoutes from './routes/communityRoutes';
=======
import attendanceRoutes from './routes/attendanceRoutes';
import payrollRoutes from './routes/payrollRoutes';
import taskRoutes from './routes/taskRoutes';
import workerAuthRoutes from './routes/workerAuthRoutes';
import receiptRoutes from './routes/receiptRoutes';
>>>>>>> main

import { errorHandler } from './middleware/errorMiddleware';

dotenv.config();
const app = express();

// 2. GLOBAL MIDDLEWARES
// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabling strict CSP since we serve React separately and it can block inline scripts/styles if not perfectly tuned
  crossOriginEmbedderPolicy: false
})); 

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use('/api', limiter);

const allowedOrigins = [
  "http://localhost:5173",
  "https://construction-ten-zeta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// Webhook route needs raw body for HMAC verification — mount BEFORE express.json()
app.use('/api/v1/wallet/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' })); // Body parser with payload limit

// Data Sanitization skipped due to req.query strict getter in modern express
// (mongoSanitize and xss-clean can cause crashes here)

// 3. API ENDPOINTS (Version 1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/workforce', workforceRoutes);
app.use('/api/v1/boq', boqRoutes);
app.use('/api/v1/tenders', tenderRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/explore', exploreRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/ai', aiRoutes); 
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/fx', fxRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/opportunities', opportunityRoutes);
<<<<<<< HEAD
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/community', communityRoutes);
=======
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/worker', workerAuthRoutes);
app.use('/api/v1/receipts', receiptRoutes);
>>>>>>> main

// 4. HEALTH CHECK ROUTE
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'BuildHub API Engine is healthy', timestamp: new Date() });
});

app.use(errorHandler);

export default app;
