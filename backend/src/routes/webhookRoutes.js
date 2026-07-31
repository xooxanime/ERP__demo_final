import express from 'express';
import {
  verifyWebhook,
  handleWebhook,
  verifyMetaSignature
} from '../controllers/webhookController.js';

const router = express.Router();

// Webhook validation path for Meta endpoint configuration
router.get('/webhook', verifyWebhook);

// Webhook update path for delivery event callbacks
router.post('/webhook', verifyMetaSignature, handleWebhook);

export default router;
