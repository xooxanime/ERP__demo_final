import express from 'express';
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  getBatchUsersList,
  createCourseInBatch,
  manageBatchStudents,
  createAssignment,
  getBatchAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  createQuiz,
  getBatchQuizzes,
  attemptQuiz,
  getQuizAttempts,
  extractQuestionsFromPdf,
  getStudentBatch,
  getParentStudentProgress,
  createAssessment,
  getBatchAssessments,
  attemptAssessment,
  submitAssessmentScores,
  getAssessmentScores,
  getStudentResults,
  getParentStudentResults,
  submitBatchAttendance,
  getBatchAttendance,
  getStudentAttendance
} from '../controllers/batchController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All batch routes require authentication
router.use(protect);

// Student batch routes (must be defined BEFORE /:id to prevent route shadowing)
router.get('/student/my-batch', authorize('student'), getStudentBatch);
router.get('/student/attendance', authorize('student'), getStudentAttendance);

// Parent batch routes
router.get('/parent/student-progress/:studentId', authorize('parent'), getParentStudentProgress);

// Common list endpoint for admin and teachers
router.get('/users/list', authorize('admin', 'teacher'), getBatchUsersList);

// Assignment routes
router.post('/assignments', authorize('teacher', 'admin'), createAssignment);
router.get('/:batchId/assignments', authorize('teacher', 'student', 'admin'), getBatchAssignments);
router.post('/assignments/:assignmentId/submit', authorize('student'), submitAssignment);
router.get('/assignments/:assignmentId/submissions', authorize('teacher', 'admin'), getAssignmentSubmissions);
router.post('/assignments/submissions/:submissionId/grade', authorize('teacher'), gradeSubmission);

// Quiz routes
router.post('/quizzes/extract-questions', authorize('teacher', 'admin'), upload.single('pdf'), extractQuestionsFromPdf);
router.post('/quizzes', authorize('teacher', 'admin'), createQuiz);
router.get('/:batchId/quizzes', authorize('teacher', 'student', 'admin'), getBatchQuizzes);
router.post('/quizzes/:quizId/attempt', authorize('student'), attemptQuiz);
router.get('/quizzes/:quizId/attempts', authorize('teacher', 'admin'), getQuizAttempts);

// Unified Assessment & Results routes
router.get('/student/results', authorize('student'), getStudentResults);
router.get('/parent/results/:studentId', authorize('parent'), getParentStudentResults);
router.post('/assessments', authorize('teacher', 'admin'), createAssessment);
router.get('/:batchId/assessments', authorize('teacher', 'student', 'parent', 'admin'), getBatchAssessments);
router.post('/assessments/:assessmentId/attempt', authorize('student'), attemptAssessment);
router.post('/assessments/:examId/scores', authorize('teacher'), submitAssessmentScores);
router.get('/assessments/:examId/scores', authorize('teacher', 'admin'), getAssessmentScores);

// Base Batch CRUD routes
router.post('/', authorize('admin'), createBatch);
router.get('/', authorize('admin', 'teacher'), getAllBatches);
router.get('/:id', authorize('admin', 'teacher', 'student'), getBatchById);
router.put('/:id', authorize('admin'), updateBatch);
router.delete('/:id', authorize('admin'), deleteBatch);

// Course inside batch management
router.post('/:batchId/courses', authorize('teacher', 'admin'), createCourseInBatch);

// Student enrollment inside batch management
router.post('/:batchId/students', authorize('admin', 'teacher'), manageBatchStudents);

// Attendance management inside batch
router.post('/:batchId/attendance', authorize('teacher', 'admin'), submitBatchAttendance);
router.get('/:batchId/attendance', authorize('teacher', 'admin'), getBatchAttendance);

export default router;
