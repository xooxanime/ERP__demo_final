import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import LiveClass from '../models/LiveClass.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import Batch from '../models/Batch.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { meetingManager } from '../utils/meetingProvider.js';


// @desc    Get student dashboard
// @route   GET /api/student/dashboard
// @access  Private (Student)
export const getStudentDashboard = async (req, res) => {
  try {
    const studentBatch = await Batch.findOne({ students: req.user.id });
    const batchCourseIds = studentBatch ? studentBatch.courses : [];

    const enrollments = await Enrollment.find({ 
      studentId: req.user.id,
      courseId: { $in: batchCourseIds }
    })
      .populate('courseId', 'title thumbnail instructor category')
      .sort({ enrollmentDate: -1 });

    const stats = {
      totalEnrolled: enrollments.length,
      inProgress: enrollments.filter(e => e.status === 'active' && e.progress < 100).length,
      completed: enrollments.filter(e => e.status === 'completed' || e.progress === 100).length
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        recentCourses: enrollments.slice(0, 4)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get enrolled courses
// @route   GET /api/student/my-courses
// @access  Private (Student)
export const getMyCourses = async (req, res) => {
  try {
    const studentBatch = await Batch.findOne({ students: req.user.id });
    const batchCourseIds = studentBatch ? studentBatch.courses : [];

    const enrollments = await Enrollment.find({ 
      studentId: req.user.id,
      courseId: { $in: batchCourseIds }
    })
      .populate('courseId')
      .sort({ lastAccessedDate: -1 });

    res.status(200).json({
      status: 'success',
      results: enrollments.length,
      data: { enrollments }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get course content
// @route   GET /api/student/course/:id/content
// @access  Private (Student)
export const getCourseContent = async (req, res) => {
  try {
    // Check if student is enrolled first
    const enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId: req.params.id
    });

    if (!enrollment) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not enrolled in this course'
      });
    }

    // Enforce batch-to-course linkage checks with fallback for legacy courses
    const studentBatch = await Batch.findOne({ students: req.user.id });
    if (studentBatch) {
      const course = await Course.findById(req.params.id);
      const isCourseInBatch = studentBatch.courses && studentBatch.courses.some(cId => cId.toString() === req.params.id);
      if (course && course.batch && course.batch.toString() !== studentBatch._id.toString() && !isCourseInBatch) {
        return res.status(403).json({
          status: 'error',
          message: 'You cannot access a course outside your batch'
        });
      }
    }

    // Get course details
    const course = await Course.findById(req.params.id);

    // Get all modules with videos
    const modules = await Module.find({ courseId: req.params.id, isPublished: true })
      .sort({ order: 1 });

    // Query study materials for this course and student's batch
    const filter = { course: req.params.id, isActive: true };
    if (studentBatch) {
      filter.$or = [
        { batchId: studentBatch._id },
        { batchId: { $exists: false } },
        { batchId: null }
      ];
    }
    const studyMaterials = await StudyMaterial.find(filter)
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 });

    // Query assignments for this course and student's batch
    const assignmentsFilter = { courseId: req.params.id };
    if (studentBatch) {
      assignmentsFilter.$or = [
        { batchId: studentBatch._id },
        { batchId: { $exists: false } },
        { batchId: null }
      ];
    }
    const assignments = await Assignment.find(assignmentsFilter)
      .sort({ dueDate: 1 });

    // Fetch student's submissions for these assignments
    const submissions = await Submission.find({
      studentId: req.user.id,
      assignmentId: { $in: assignments.map(a => a._id) }
    }).lean();

    const assignmentsWithSubmission = assignments.map(a => {
      const plainA = a.toObject();
      plainA.submission = submissions.find(s => s.assignmentId.toString() === a._id.toString()) || null;
      return plainA;
    });

    // Query quizzes for this course and student's batch
    const quizzesFilter = { courseId: req.params.id };
    if (studentBatch) {
      quizzesFilter.$or = [
        { batchId: studentBatch._id },
        { batchId: { $exists: false } },
        { batchId: null }
      ];
    }
    const quizzes = await Quiz.find(quizzesFilter)
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    // Fetch student's quiz attempts
    const quizAttempts = await QuizAttempt.find({
      studentId: req.user.id,
      quizId: { $in: quizzes.map(q => q._id) }
    }).lean();

    const quizzesWithAttempt = quizzes.map(q => {
      const attempt = quizAttempts.find(att => att.quizId.toString() === q._id.toString());
      const plainQ = q.toObject();
      plainQ.attempt = attempt || null;
      plainQ.isOverdue = new Date() > new Date(q.dueDate) && !attempt;
      
      // Hide correct option index if not attempted yet and still before deadline
      if (!attempt && new Date() < new Date(q.dueDate)) {
        plainQ.questions = plainQ.questions.map(quest => {
          const { correctOptionIndex, ...rest } = quest;
          return plainQ.questions.find(qu => qu._id.toString() === quest._id.toString()) ? rest : quest;
        });
      }
      return plainQ;
    });

    // Update last accessed date
    enrollment.lastAccessedDate = Date.now();
    await enrollment.save();

    res.status(200).json({
      status: 'success',
      data: {
        course,
        modules,
        progress: enrollment.progress,
        completedVideos: enrollment.completedVideos,
        studyMaterials,
        assignments: assignmentsWithSubmission,
        quizzes: quizzesWithAttempt
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark video as completed
// @route   POST /api/student/video/:videoId/complete
// @access  Private (Student)
export const markVideoComplete = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { videoId } = req.params;

    const enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not enrolled in this course'
      });
    }

    // Add video to completed list if not already there
    if (!enrollment.completedVideos.includes(videoId)) {
      enrollment.completedVideos.push(videoId);

      // Calculate progress
      const modules = await Module.find({ courseId });
      const totalVideos = modules.reduce((acc, module) => acc + module.videos.length, 0);
      enrollment.progress = Math.round((enrollment.completedVideos.length / totalVideos) * 100);

      // Check if course is completed
      if (enrollment.progress === 100) {
        enrollment.status = 'completed';
      }

      await enrollment.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        progress: enrollment.progress,
        completedVideos: enrollment.completedVideos
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Check enrollment status
// @route   GET /api/student/enrollment-status/:courseId
// @access  Private (Student)
export const checkEnrollmentStatus = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId: req.params.courseId
    });

    if (enrollment) {
        return res.status(200).json({
            status: 'success',
            data: {
              isEnrolled: true,
              enrollment
            }
        });
    }

    // Check for pending payment
    const pendingPayment = await Payment.findOne({
        studentId: req.user.id,
        courseId: req.params.courseId,
        status: 'pending'
    });

    res.status(200).json({
      status: 'success',
      data: {
        isEnrolled: false,
        hasPendingPayment: !!pendingPayment
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get student notifications
// @route   GET /api/student/notifications
// @access  Private (Student)
export const getStudentNotifications = async (req, res) => {
  try {
    const dbNotifs = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
    const formattedDbNotifs = dbNotifs.map(n => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      section: n.section || 'general',
      priority: n.priority || 'normal',
      courseName: n.courseName,
      read: n.read || false,
      createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString()
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

// @desc    Get student's live classes
// @route   GET /api/student/live-classes
// @access  Private (Student)
export const getStudentLiveClasses = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student batch courses
    const studentBatch = await Batch.findOne({ students: studentId });
    const courseIds = studentBatch ? studentBatch.courses : [];

    if (courseIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: []
      });
    }

    const liveClasses = await LiveClass.find({ courseId: { $in: courseIds } })
      .populate('courseId', 'title')
      .populate('teacherId', 'name avatar')
      .sort({ startTime: 1 });

    // Format meeting links to full URLs dynamically
    const formattedClasses = liveClasses.map(lc => {
      const lcObj = lc.toObject();
      const rawRoomId = lc.meetingLink;
      if (lcObj.meetingLink && !lcObj.meetingLink.startsWith('http')) {
        lcObj.meetingLink = meetingManager.getUrl(lcObj.meetingLink);
      }
      // Generate Jitsi JWT token for student as participant
      lcObj.jwt = meetingManager.generateToken(rawRoomId, req.user, false);
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

// @desc    Record student joining live class
// @route   POST /api/student/live-classes/:id/join
// @access  Private (Student)
export const recordLiveClassJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return res.status(404).json({
        status: 'error',
        message: 'Live class not found'
      });
    }

    // Check if class is already cancelled or ended
    if (liveClass.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'This class has been cancelled'
      });
    }

    // Verify student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: liveClass.courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not enrolled in the course for this live class'
      });
    }

    // Check if attendance already exists (handles reconnects)
    let attendance = await Attendance.findOne({ liveClassId: id, studentId });

    if (attendance) {
      // Reconnect: clear leftAt to resume session
      attendance.leftAt = undefined;
      await attendance.save();
    } else {
      // New join
      attendance = await Attendance.create({
        liveClassId: id,
        studentId,
        courseId: liveClass.courseId,
        joinedAt: new Date(),
        status: 'present'
      });
    }

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

// @desc    Record student leaving live class
// @route   POST /api/student/live-classes/:id/leave
// @access  Private (Student)
export const recordLiveClassLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const attendance = await Attendance.findOne({ liveClassId: id, studentId });
    if (!attendance) {
      return res.status(404).json({
        status: 'error',
        message: 'Attendance record not found for this class'
      });
    }

    const leftAt = new Date();
    const durationMs = leftAt.getTime() - new Date(attendance.joinedAt).getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / 1000 / 60)); // at least 1 minute if left quickly

    attendance.leftAt = leftAt;
    attendance.durationMinutes = (attendance.durationMinutes || 0) + durationMinutes;
    await attendance.save();

    // Recalculate unique attendance count for the live class
    const attendanceCount = await Attendance.countDocuments({ liveClassId: id });
    await LiveClass.findByIdAndUpdate(id, { attendanceCount });

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

// @desc    Mark student notifications as read
// @route   PUT /api/student/notifications/mark-read
// @access  Private (Student)
export const markNotificationsRead = async (req, res) => {
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


