import express from 'express';
import {
  getAllStudyMaterials,
  getStudyMaterialById,
  downloadStudyMaterial,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial
} from '../controllers/studyMaterialController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllStudyMaterials);
router.get('/:id', getStudyMaterialById);

// Student routes
router.post('/:id/download', protect, downloadStudyMaterial);

// Admin and Teacher routes
router.post('/', protect, authorize('admin', 'teacher'), createStudyMaterial);
router.put('/:id', protect, authorize('admin', 'teacher'), updateStudyMaterial);
router.delete('/:id', protect, authorize('admin', 'teacher'), deleteStudyMaterial);

export default router;
