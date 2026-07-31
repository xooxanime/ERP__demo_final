import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import studyMaterialRoutes from './routes/studyMaterialRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import parentRoutes from './routes/parentRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import whatsappAdminRoutes from './routes/whatsappAdminRoutes.js';
import { getMetrics, getContentType } from './utils/metrics.js';
import mongoose from 'mongoose';
import queueService from './services/queueService.js';
import { startBroadcastScheduler } from './services/broadcastScheduler.js';
import feeRoutes from './routes/feeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { startReconciliationService } from './services/reconciliationService.js';
import assessmentRoutes from './routes/assessmentRoutes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB().then(() => {
  startBroadcastScheduler();
}).catch(err => {
  console.error('Failed to start broadcast scheduler:', err.message);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(mongoSanitize());

// Rate limiting (increased for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

import path from 'path';

// Body parser middleware
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api', chatbotRoutes);
app.use('/api/whatsapp', webhookRoutes);
app.use('/api/admin/whatsapp', whatsappAdminRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/assessment', assessmentRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const queueStats = await queueService.getStats();
  const redisStatus = queueStats.mode === 'REDIS' ? 'connected' : 'disconnected';
  
  const healthData = {
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbStatus,
      redis: redisStatus,
      queueMode: queueStats.mode,
      worker: queueStats.mode === 'REDIS' ? (queueService.worker ? 'active' : 'inactive') : 'active (virtual)'
    }
  };

  const code = (dbStatus === 'connected') ? 200 : 503;
  res.status(code).json(healthData);
});

// Metrics endpoint for Prometheus monitoring
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', getContentType());
    res.end(await getMetrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  // Start payment reconciliation cron daemon (runs every 15 minutes in background)
  startReconciliationService(15);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
