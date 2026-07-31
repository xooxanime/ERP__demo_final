import express from 'express';
import {
  getCourseProgress,
  getAllProgress,
  markVideoComplete,
  addQuizScore,
  getProgressAnalytics
} from '../controllers/progressController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student routes
router.get('/', protect, getAllProgress);
router.get('/:courseId', protect, getCourseProgress);
router.post('/:courseId/video/:videoId', protect, markVideoComplete);
router.post('/:courseId/quiz', protect, addQuizScore);

// Admin routes
router.get('/analytics/all', protect, authorize('admin'), getProgressAnalytics);

export default router;
