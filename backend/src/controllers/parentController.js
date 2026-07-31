import mongoose from 'mongoose';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import LiveClass from '../models/LiveClass.js';
import Notification from '../models/Notification.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import { meetingManager } from '../utils/meetingProvider.js';


export const resolveChildIdForUser = async (user) => {
  if (!user || user.role !== 'parent') return user?._id || user?.id;
  let studentId = user.parentInfo?.studentId;
  if (studentId?._id) studentId = studentId._id;
  
  if (!studentId && user.parentInfo?.studentName) {
    const student = await User.findOne({
      role: 'student',
      name: new RegExp(`^${user.parentInfo.studentName.trim()}$`, 'i')
    });
    if (student) studentId = student._id;
  }

  // Fallback: Check fresh DB record for this parent user
  if (!studentId && (user._id || user.id)) {
    const freshParent = await User.findById(user._id || user.id);
    if (freshParent?.parentInfo?.studentId) {
      studentId = freshParent.parentInfo.studentId;
    }
    if (!studentId && freshParent?.parentInfo?.studentName) {
      const st = await User.findOne({
        role: 'student',
        name: new RegExp(`^${freshParent.parentInfo.studentName.trim()}$`, 'i')
      });
      if (st) studentId = st._id;
    }
  }

  return studentId;
};

// @desc Get Parent Dashboard
// @route GET /api/parent/dashboard
// @access Private (Parent)
export const getParentDashboard = async (req, res) => {
  try {
    const studentId = await resolveChildIdForUser(req.user);

    if (!studentId) {
      return res.status(404).json({
        status: 'error',
        message: 'No student linked to this parent account'
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'The linked student account was not found'
      });
    }

    const studentBatch = await Batch.findOne({ students: studentId });
    const batchCourseIds = studentBatch?.courses || [];

    const enrollQuery = { studentId };
    if (batchCourseIds.length > 0) {
      enrollQuery.courseId = { $in: batchCourseIds };
    }

    const enrollments = await Enrollment.find(enrollQuery).populate('courseId');

    const totalCourses = enrollments.length;

    const avgProgress =
      totalCourses > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + e.progress, 0) /
              totalCourses
          )
        : 0;

    const completedCourses = enrollments.filter(
      e => e.status === 'completed'
    ).length;

    res.status(200).json({
      status: 'success',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email
        },
        stats: {
          totalCourses,
          avgProgress,
          completedCourses
        },
        enrollments
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc Get Child Progress
// @route GET /api/parent/progress
// @access Private (Parent)
export const getParentProgress = async (req, res) => {
  try {
    const studentId = await resolveChildIdForUser(req.user);

    const studentBatch = await Batch.findOne({ students: studentId });
    const batchCourseIds = studentBatch?.courses || [];

    const progQuery = { student: studentId };
    if (batchCourseIds.length > 0) {
      progQuery.course = { $in: batchCourseIds };
    }

    const progress = await Progress.find(progQuery).populate('course');

    res.status(200).json({
      status: 'success',
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc Get Child Attendance
// @route GET /api/parent/attendance
// @access Private (Parent)
export const getParentAttendance = async (req, res) => {
  try {
    const studentId = await resolveChildIdForUser(req.user);

    if (!studentId) {
      return res.status(404).json({
        status: 'error',
        message: 'No student linked to this parent account'
      });
    }

    const studentBatch = await Batch.findOne({ students: studentId });
    const batchCourseIds = studentBatch?.courses || [];

    const attQuery = { studentId };
    if (batchCourseIds.length > 0) {
      attQuery.courseId = { $in: batchCourseIds };
    }

    const enrollments = await Enrollment.find(attQuery).populate('courseId');

    const records = await Attendance.find({
      studentId,
      $or: [
        { batchId: studentBatch?._id },
        { batchId: { $exists: false } },
        { batchId: null }
      ]
    });

    const attendance = enrollments.map(enrollment => {
      const courseIdStr = enrollment.courseId?._id?.toString();
      const courseRecords = records.filter(r => r.courseId?.toString() === courseIdStr);

      const present = courseRecords.filter(r => r.status === 'present').length;
      const absent = courseRecords.filter(r => r.status === 'absent').length;
      const late = courseRecords.filter(r => r.status === 'late').length;
      const leave = courseRecords.filter(r => r.status === 'leave').length;
      const total = courseRecords.length;

      const attended = present + late + leave;
      const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 100;

      return {
        course: enrollment.courseId?.title,
        progress: enrollment.progress,
        status: enrollment.status,
        lastAccessedDate: enrollment.lastAccessedDate,
        attendanceRate,
        present,
        absent,
        late,
        leave,
        total
      };
    });

    res.status(200).json({
      status: 'success',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc Get Parent Notifications
// @route GET /api/parent/notifications
// @access Private (Parent)
export const getParentNotifications = async (req, res) => {
  try {
    const dbNotifs = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
    const formattedDbNotifs = dbNotifs.map(n => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      section: n.section || 'general',
      courseName: n.courseName || 'General Academic',
      read: n.isRead || n.read || false,
      createdAt: n.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: formattedDbNotifs
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc Get Child Courses
// @route GET /api/parent/courses
// @access Private (Parent)
export const getParentCourses = async (req, res) => {
  try {
    const studentId = req.user.parentInfo?.studentId;

    if (!studentId) {
      return res.status(404).json({
        status: 'error',
        message: 'No student linked to this parent account'
      });
    }

    const studentBatch = await Batch.findOne({ students: studentId });
    const batchCourseIds = studentBatch ? studentBatch.courses : [];

    const enrollments = await Enrollment.find({
      studentId,
      courseId: { $in: batchCourseIds }
    }).populate('courseId');

    const courses = enrollments.map(enrollment => ({
      enrollmentId: enrollment._id,
      progress: enrollment.progress,
      status: enrollment.status,
      course: enrollment.courseId
    }));

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc Get Child Live Classes
// @route GET /api/parent/live-classes
// @access Private (Parent)
export const getParentLiveClasses = async (req, res) => {
  try {
    const studentId = req.user.parentInfo?.studentId;

    if (!studentId) {
      return res.status(404).json({
        status: 'error',
        message: 'No student linked to this parent account'
      });
    }

    const studentBatch = await Batch.findOne({ students: studentId });
    const batchCourseIds = studentBatch ? studentBatch.courses : [];

    const enrollments = await Enrollment.find({ studentId, courseId: { $in: batchCourseIds } });
    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: []
      });
    }

    const courseIds = enrollments.map(e => e.courseId);

    let liveClasses = await LiveClass.find({ courseId: { $in: courseIds } })
      .populate('courseId', 'title')
      .populate('teacherId', 'name')
      .sort({ startTime: 1 });

    // Auto-seed mock data in development mode if no live classes exist
    if (liveClasses.length === 0 && process.env.NODE_ENV === 'development') {
      const teacher = await User.findOne({ role: 'teacher' });
      const teacherId = teacher ? teacher._id : new mongoose.Types.ObjectId();
      
      const now = new Date();
      const mockClasses = [
        {
          title: 'Advanced Mongoose Queries & Virtuals',
          description: 'A deep dive into MongoDB aggregation framework, indexing, and virtual fields.',
          courseId: courseIds[0],
          teacherId,
          meetingLink: 'https://zoom.us/j/9876543210',
          startTime: new Date(now.getTime() - 15 * 60 * 1000), // Started 15 mins ago
          endTime: new Date(now.getTime() + 45 * 60 * 1000),   // Ends in 45 mins
          status: 'live'
        },
        {
          title: 'React Performance Optimization Masterclass',
          description: 'Learn when and how to use useMemo, useCallback, and React.memo.',
          courseId: courseIds[0],
          teacherId,
          meetingLink: 'https://zoom.us/j/9876543211',
          startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(now.getTime() + 25.5 * 60 * 60 * 1000),
          status: 'scheduled'
        },
        {
          title: 'Introduction to Express Middleware',
          description: 'Understanding application-level, router-level, and error-handling middleware.',
          courseId: courseIds[0],
          teacherId,
          meetingLink: 'https://zoom.us/j/9876543212',
          startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
          status: 'completed'
        }
      ];

      // If there's a second course, allocate one of the mock classes to it
      if (courseIds.length > 1) {
        mockClasses[1].courseId = courseIds[1];
      }

      await LiveClass.insertMany(mockClasses);

      // Re-fetch populated classes
      liveClasses = await LiveClass.find({ courseId: { $in: courseIds } })
        .populate('courseId', 'title')
        .populate('teacherId', 'name')
        .sort({ startTime: 1 });
    }

    const formattedClasses = liveClasses.map(lc => {
      const lcObj = lc.toObject();
      if (lcObj.meetingLink && !lcObj.meetingLink.startsWith('http')) {
        lcObj.meetingLink = meetingManager.getUrl(lcObj.meetingLink);
      }
      return lcObj;
    });

    res.status(200).json({
      status: 'success',
      results: formattedClasses.length,
      data: formattedClasses
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark parent notifications as read
// @route   PUT /api/parent/notifications/mark-read
// @access  Private (Parent)
export const markParentNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    const query = { recipient: req.user.id };
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    await Notification.updateMany(query, { $set: { read: true } });

    res.status(200).json({
      status: 'success',
      message: 'Notifications marked as read successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};