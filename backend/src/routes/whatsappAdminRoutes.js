import express from 'express';
import {
  getWhatsAppLogs,
  getWhatsAppStats,
  getWhatsAppConfig,
  sendTestWhatsAppMessage,
  getQueueStats,
  reprocessDLQJob,
  bulkReprocessDLQ,
  deleteDLQJob,
  bulkDeleteDLQ,
  getWhatsAppTemplates,
  createWhatsAppTemplateVersion,
  toggleWhatsAppTemplate
} from '../controllers/whatsappAdminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply admin auth guards to all administrative configurations
router.use(protect);
router.use(authorize('admin'));

router.get('/logs', getWhatsAppLogs);
router.get('/stats', getWhatsAppStats);
router.get('/config', getWhatsAppConfig);
router.post('/test', sendTestWhatsAppMessage);

router.get('/queue-stats', getQueueStats);
router.post('/dlq/reprocess/:id', reprocessDLQJob);
router.post('/dlq/reprocess', bulkReprocessDLQ);
router.delete('/dlq/:id', deleteDLQJob);
router.delete('/dlq', bulkDeleteDLQ);

router.get('/templates', getWhatsAppTemplates);
router.post('/templates/version', createWhatsAppTemplateVersion);
router.patch('/templates/:id/toggle', toggleWhatsAppTemplate);

export default router;
