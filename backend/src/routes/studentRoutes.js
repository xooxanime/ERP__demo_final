import express from 'express';
import {
  getStudentDashboard,
  getMyCourses,
  getCourseContent,
  markVideoComplete,
  checkEnrollmentStatus,
  getStudentNotifications,
  markNotificationsRead,
  getStudentLiveClasses,
  recordLiveClassJoin,
  recordLiveClassLeave
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getStudentDashboard);
router.get('/my-courses', getMyCourses);
router.get('/course/:id/content', getCourseContent);
router.post('/video/:videoId/complete', markVideoComplete);
router.get('/enrollment-status/:courseId', checkEnrollmentStatus);
router.get('/notifications', getStudentNotifications);
router.put('/notifications/mark-read', markNotificationsRead);

// Live Classes & Attendance tracking
router.get('/live-classes', getStudentLiveClasses);
router.post('/live-classes/:id/join', recordLiveClassJoin);
router.post('/live-classes/:id/leave', recordLiveClassLeave);

export default router;
