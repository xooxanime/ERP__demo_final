import express from 'express';
import {
  getTeacherDashboard,
  getTeacherCourses,
  getTeacherStudents,
  getStudentProgress,
  getTeacherBatches,
  getTeacherSchedule,
  getTeacherLiveClasses,
  createLiveClass,
  updateLiveClassStatus,
  deleteLiveClass,
  getTeacherUserNotifications,
  markTeacherNotificationsRead
} from '../controllers/teacherController.js';
import { createNotification, listNotifications } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('teacher'));

// Dashboard
router.get('/dashboard', getTeacherDashboard);

// Courses
router.get('/courses', getTeacherCourses);

// Students
router.get('/students', getTeacherStudents);
router.get('/student/:studentId/progress', getStudentProgress);

// Batches
router.get('/batches', getTeacherBatches);

// Schedule
router.get('/schedule', getTeacherSchedule);

// Live Classes
router.get('/live-classes', getTeacherLiveClasses);
router.post('/live-classes', createLiveClass);
router.patch('/live-classes/:id/status', updateLiveClassStatus);
router.delete('/live-classes/:id', deleteLiveClass);

// Course content management (delegated to adminController for reuse)
import {
  addModule,
  updateModule,
  deleteModule,
  addVideo,
  deleteVideo,
  addNote,
  deleteNote,
  getCourseContent
} from '../controllers/adminController.js';

router.get('/courses/:id/content', getCourseContent);
router.post('/courses/:id/modules', addModule);
router.put('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);
router.post('/modules/:id/videos', addVideo);
router.delete('/modules/:moduleId/videos/:videoId', deleteVideo);
router.post('/modules/:id/notes', addNote);
router.delete('/modules/:moduleId/notes/:noteId', deleteNote);

// Notification management (course-scoped broadcast + history)
router.post('/notifications', createNotification);
router.get('/notifications', listNotifications);
router.get('/user-notifications', getTeacherUserNotifications);
router.put('/notifications/mark-read', markTeacherNotificationsRead);

export default router;
