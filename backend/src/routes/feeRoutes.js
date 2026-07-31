import express from 'express';
import {
  createFeeHead,
  getFeeHeads,
  createFeeStructure,
  getFeeStructures,
  deleteFeeStructure,
  getStudentFeeLedgers,
  adjustLedgerItem,
  createPaymentOrder,
  verifyPayment,
  downloadReceiptPDF,
  handleRazorpayWebhook,
  getActiveSession
} from '../controllers/feeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Razorpay Webhook Callback (requires public access for server-to-server posts)
router.post('/payment/webhook', handleRazorpayWebhook);

// All other routes require authentication
router.use(protect);

// Active Academic Session (Authenticated)
router.get('/sessions/active', getActiveSession);

// Fee Head Management (Admin Only)
router.post('/heads', authorize('admin'), createFeeHead);
router.get('/heads', getFeeHeads);

// Fee Structure Management (Admin Only)
router.post('/structures', authorize('admin'), createFeeStructure);
router.get('/structures', getFeeStructures);
router.delete('/structures/:id', authorize('admin'), deleteFeeStructure);

// Student Ledgers
router.get('/ledgers', authorize('admin', 'student', 'parent'), getStudentFeeLedgers);
router.put('/ledgers/:ledgerId', authorize('admin'), adjustLedgerItem);

// Checkout & Payments
router.post('/payment/create-order', authorize('student', 'parent'), createPaymentOrder);
router.post('/payment/verify', authorize('student', 'parent'), verifyPayment);

// Download Receipt PDF (Streams directly back to client)
router.get('/payment/receipt/:paymentId', downloadReceiptPDF);

export default router;
