import express from 'express';
import { 
  generateAssessment, 
  submitAssessment, 
  getHistory,
  getDefaultStudent,
  getDashboardData
} from '../controllers/assessmentController.js';

const router = express.Router();

// Helper to get or bootstrap a default student
router.get('/student/default', getDefaultStudent);

// Dashboard data endpoint
router.get('/dashboard/:studentId', getDashboardData);

// Standard endpoints requested
router.post('/generate', generateAssessment);
router.post('/submit', submitAssessment);
router.get('/history/:studentId', getHistory);

export default router;
