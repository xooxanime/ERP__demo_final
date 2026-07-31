import express from 'express';
import {
  getAdminDashboard,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
  deleteVideo,
  deleteNote,
  addVideo,
  addNote,
  getCourseContent,
  getAllEnrollments,
  getAllStudents,
  updateStudentStatus,
  updateHeroSection,
  getHeroSection,
  getPendingPayments,
  verifyPayment,
  getAdminLiveClasses,
  createAdminLiveClass,
  getAdminUserNotifications,
  markAdminNotificationsRead
} from '../controllers/adminController.js';
import { updateLiveClassStatus, deleteLiveClass } from '../controllers/teacherController.js';
import { createNotification, listNotifications } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public route for hero section (needed for homepage)
router.get('/hero-section', getHeroSection);

// Protect all other routes and authorize only admin
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Course management
router.post('/courses', createCourse);
router.get('/courses/:id/content', getCourseContent);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Module management
router.post('/courses/:id/modules', addModule);
router.put('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);

// Video and notes
router.post('/modules/:id/videos', addVideo);
router.delete('/modules/:moduleId/videos/:videoId', deleteVideo);
router.post('/modules/:id/notes', addNote);
router.delete('/modules/:moduleId/notes/:noteId', deleteNote);

// Enrollments, students, and payments
router.get('/enrollments', getAllEnrollments);
router.get('/students', getAllStudents);
router.put('/students/:id', updateStudentStatus);
router.get('/payments/pending', getPendingPayments);
router.get('/pending-payments', getPendingPayments); // Fallback alias
router.put('/payments/:id/verify', verifyPayment);
router.put('/payments/:id/approve', (req, res, next) => {
  req.body.status = 'success';
  verifyPayment(req, res, next);
}); // Fallback alias
router.put('/payments/:id/reject', (req, res, next) => {
  req.body.status = 'failed';
  verifyPayment(req, res, next);
}); // Fallback alias

// Live class management
router.get('/live-classes', getAdminLiveClasses);
router.post('/live-classes', createAdminLiveClass);
router.patch('/live-classes/:id/status', updateLiveClassStatus);
router.delete('/live-classes/:id', deleteLiveClass);

// Hero section update
router.put('/hero-section', updateHeroSection);

// Notification management (broadcast + history)
router.post('/notifications', createNotification);
router.get('/notifications', listNotifications);
router.get('/user-notifications', getAdminUserNotifications);
router.put('/notifications/mark-read', markAdminNotificationsRead);

export default router;
