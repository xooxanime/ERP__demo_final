import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  submitApprovalRequest,
  getAllApprovalRequests,
  updateApprovalRequest,
  getAllPermissions,
  updatePermissions,
  getUserPermissions
} from '../controllers/approvalController.js';

const router = express.Router();

// Public routes
router.post('/request', submitApprovalRequest);

// Admin routes
router.get('/requests', protect, authorize('admin'), getAllApprovalRequests);
router.put('/:requestId', protect, authorize('admin'), updateApprovalRequest);
router.get('/admin/permissions', protect, authorize('admin'), getAllPermissions);
router.put('/admin/permissions/:role', protect, authorize('admin'), updatePermissions);

// User routes
router.get('/user/:userId', protect, getUserPermissions);

export default router;
