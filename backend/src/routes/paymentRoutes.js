import express from 'express';
import {
  createManualPayment,
  getPaymentHistory
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('student'));

router.post('/manual-payment', createManualPayment);
router.get('/history', getPaymentHistory);

export default router;
