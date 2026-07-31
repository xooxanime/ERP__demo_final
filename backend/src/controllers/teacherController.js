import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import Module from '../models/Module.js';
import LiveClass from '../models/LiveClass.js';
import Batch from '../models/Batch.js';
import Notification from '../models/Notification.js';
import { meetingManager } from '../utils/meetingProvider.js';
import notificationService from '../services/notificationService.js';


// @desc    Get teacher dashboard
// @route   GET /api/teacher/dashboard
// @access  Private (Teacher)
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher's courses
    const courses = await Course.find({
      $or: [
        { instructor: teacherId },
        { instructor: req.user.name },
        { _id: { $in: req.user.teacherInfo?.assignedCourses || [] } }
      ]
    });
    const courseIds = courses.map(c => c._id);

    // Get all enrollments for teacher's courses
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate('studentId', 'name email phone')
      .populate('courseId', 'title');

    // Get unique students
    const uniqueStudents = new Set(enrollments.map(e => e.studentId._id.toString()));

    // Calculate stats
    const stats = {
      totalStudents: uniqueStudents.size,
      activeBatches: courses.length,
      classesToday: 3, // Mock data - can be fetched from schedule
      pendingReviews: enrollments.filter(e => e.status === 'active').length
    };

    // Get batch performance data
    const batchPerformance = courses.map(course => ({
      batch: course.title,
      avgScore: Math.floor(Math.random() * 40 + 60), // Mock data
      attendance: Math.floor(Math.random() * 30 + 70) // Mock data
    }));

    // Get recent students
    const recentStudents = enrollments
      .sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate))
      .slice(0, 5)
      .map(e => ({
        name: e.studentId.name,
        batch: e.courseId?.title || 'Unknown',
        attendance: Math.floor(Math.random() * 30 + 70) + '%',
        lastSeen: new Date(e.lastAccessedDate).toLocaleDateString()
      }));

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        batchPerformance,
        recentStudents
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get teacher's courses
// @route   GET /api/teacher/courses
// @access  Private (Teacher)
export const getTeacherCourses = async (req, res) => {
  try {
    console.log('--- getTeacherCourses debug ---');
    console.log('User from request:', {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      teacherInfo: req.user.teacherInfo
    });

    let courses = await Course.find({
      $or: [
        { instructor: req.user.id },
        { instructor: req.user.name },
        { _id: { $in: req.user.teacherInfo?.assignedCourses || [] } }
      ]
    }).populate('modules');

    if (courses.length === 0) {
      console.log('No specific courses assigned to teacher. Falling back to all courses for verification.');
      courses = await Course.find().populate('modules');
    }

    console.log('Courses found for query:', courses.map(c => ({ id: c._id, title: c.title, instructor: c.instructor })));

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: { courses }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get teacher's students
// @route   GET /api/teacher/students
// @access  Private (Teacher)
export const getTeacherStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher's courses
    const courses = await Course.find({
      $or: [
        { instructor: teacherId },
        { instructor: req.user.name },
        { _id: { $in: req.user.teacherInfo?.assignedCourses || [] } }
      ]
    });
    const courseIds = courses.map(c => c._id);

    // Get all enrollments for teacher's courses
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate('studentId', 'name email phone avatar')
      .populate('courseId', 'title');

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

// @desc    Get student progress
// @route   GET /api/teacher/student/:studentId/progress
// @access  Private (Teacher)
export const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher has access to this student
    const courses = await Course.find({
      $or: [
        { instructor: teacherId },
        { instructor: req.user.name },
        { _id: { $in: req.user.teacherInfo?.assignedCourses || [] } }
      ]
    });
    const courseIds = courses.map(c => c._id);

    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: { $in: courseIds }
    }).populate('courseId');

    if (!enrollment) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this student'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        enrollment,
        progress: enrollment.progress,
        completedVideos: enrollment.completedVideos.length,
        status: enrollment.status
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get teacher's batches
// @route   GET /api/teacher/batches
// @access  Private (Teacher)
export const getTeacherBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ teachers: req.user.id })
      .populate('teachers', 'name email phone')
      .populate('students', 'name email phone')
      .populate('courses', 'title category instructor')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: batches.length,
      data: { batches }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get teacher's schedule
// @route   GET /api/teacher/schedule
// @access  Private (Teacher)
export const getTeacherSchedule = async (req, res) => {
  try {
    // Mock schedule data - can be extended with actual schedule model
    const schedule = [
      {
        time: '10:00 AM',
        title: 'Advanced Auditing',
        batch: 'CA Final Batch A',
        type: 'live'
      },
      {
        time: '2:00 PM',
        title: 'Corporate Law',
        batch: 'CA Inter Batch B',
        type: 'live'
      },
      {
        time: '4:30 PM',
        title: 'Doubt Session',
        batch: 'All Batches',
        type: 'live'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: { schedule }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get teacher's live classes
// @route   GET /api/teacher/live-classes
// @access  Private (Teacher)
export const getTeacherLiveClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    let courses = await Course.find({
      $or: [
        { instructor: teacherId },
        { instructor: req.user.name },
        { _id: { $in: req.user.teacherInfo?.assignedCourses || [] } }
      ]
    });
    let courseIds = courses.map(c => c._id);

    if (courseIds.length === 0) {
      const allCourses = await Course.find();
      courseIds = allCourses.map(c => c._id);
    }

    const liveClasses = await LiveClass.find({
      $or: [
        { teacherId },
        { courseId: { $in: courseIds } }
      ]
    })
      .populate('courseId', 'title')
      .populate('teacherId', 'name')
      .sort({ startTime: 1 });

    // Format meeting links to full URLs dynamically
    const formattedClasses = liveClasses.map(lc => {
      const lcObj = lc.toObject();
      const rawRoomId = lc.meetingLink;
      if (lcObj.meetingLink && !lcObj.meetingLink.startsWith('http')) {
        lcObj.meetingLink = meetingManager.getUrl(lcObj.meetingLink);
      }
      // Generate Jitsi JWT token for teacher as moderator
      lcObj.jwt = meetingManager.generateToken(rawRoomId, req.user, true);
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

// @desc    Create a new live class
// @route   POST /api/teacher/live-classes
// @access  Private (Teacher)
export const createLiveClass = async (req, res) => {
  try {
    const { title, description, courseId, startTime, endTime } = req.body;
    const teacherId = req.user.id;

    // --- Strong input validation: a live class can never exist without a valid course ---
    if (!courseId) {
      return res.status(400).json({
        status: 'error',
        message: 'A course is required to schedule a live class'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Live class title is required'
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Both start time and end time are required'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid start or end time provided'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        status: 'error',
        message: 'End time must be after the start time'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Generate room ID instead of a full URL
    const meetingData = meetingManager.generateMeeting(course.title);
    const roomId = meetingData.roomId;

    const liveClass = await LiveClass.create({
      teacherId,
      courseId,
      title,
      description,
      meetingLink: roomId, // Store only the room ID
      startTime,
      endTime,
      status: 'scheduled'
    });

    const liveClassObj = liveClass.toObject();
    if (liveClassObj.meetingLink && !liveClassObj.meetingLink.startsWith('http')) {
      liveClassObj.meetingLink = meetingManager.getUrl(liveClassObj.meetingLink);
    }
    liveClassObj.jwt = meetingManager.generateToken(roomId, req.user, true);

    res.status(201).json({
      status: 'success',
      data: liveClassObj
    });

    // Trigger scheduled class notifications (In-app, WhatsApp, Email) in background (non-blocking)
    setImmediate(async () => {
      try {
        const enrollments = await Enrollment.find({ courseId }).populate('studentId');
        const students = enrollments.map(e => e.studentId).filter(s => s && s.role === 'student');
        const courseName = course.title;
        for (const student of students) {
          try {
            await notificationService.notify(student, 'live_class_scheduled', {
              courseName,
              teacherName: req.user.name,
              date: new Date(startTime).toLocaleDateString(),
              time: new Date(startTime).toLocaleTimeString(),
              meetingLink: liveClassObj.meetingLink
            });
          } catch (studentErr) {
            console.error(`Failed to send scheduled class notification to student ${student._id}:`, studentErr.message);
          }
        }
      } catch (notifErr) {
        console.error('Error in background live class scheduled notifications:', notifErr.message);
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update live class status
// @route   PATCH /api/teacher/live-classes/:id/status
// @access  Private (Teacher)
export const updateLiveClassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, recordingUrl } = req.body;

    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return res.status(404).json({
        status: 'error',
        message: 'Live class not found'
      });
    }

    // Check permissions
    if (liveClass.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this class'
      });
    }

    // Validate status lifecycle
    const validStatuses = ['scheduled', 'live', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    // Capture transitions
    const isStartedTransition = status === 'live' && liveClass.status !== 'live';
    const isCancelledTransition = status === 'cancelled' && liveClass.status !== 'cancelled';
    const isCompletedTransition = status === 'completed' && liveClass.status !== 'completed';
    const isRecordingAvailableTransition = recordingUrl && recordingUrl !== liveClass.recordingUrl;

    if (status) {
      liveClass.status = status;
    }
    
    if (recordingUrl !== undefined) {
      liveClass.recordingUrl = recordingUrl;
    }

    await liveClass.save();

    // Build the response object (full meeting URL + moderator JWT) up front so the
    // background notification closure can safely reference the resolved meeting link.
    const liveClassObj = liveClass.toObject();
    const rawRoomId = liveClass.meetingLink;
    if (liveClassObj.meetingLink && !liveClassObj.meetingLink.startsWith('http')) {
      liveClassObj.meetingLink = meetingManager.getUrl(liveClassObj.meetingLink);
    }
    liveClassObj.jwt = meetingManager.generateToken(rawRoomId, req.user, true);

    // Trigger status transition notifications in background (non-blocking)
    if (isStartedTransition || isCancelledTransition || isCompletedTransition || isRecordingAvailableTransition) {
      setImmediate(async () => {
        try {
          const enrollments = await Enrollment.find({ courseId: liveClass.courseId }).populate('studentId');
          const students = enrollments.map(e => e.studentId).filter(s => s && s.role === 'student');
          const course = await Course.findById(liveClass.courseId);
          const courseName = course ? course.title : 'Course';

          for (const student of students) {
            try {
              if (isStartedTransition) {
                await notificationService.notify(student, 'live_class_started', {
                  courseName,
                  teacherName: req.user.name,
                  meetingLink: liveClassObj.meetingLink
                });
              } else if (isCancelledTransition) {
                await notificationService.notify(student, 'live_class_cancelled', {
                  courseName,
                  date: new Date(liveClass.startTime).toLocaleDateString(),
                  time: new Date(liveClass.startTime).toLocaleTimeString()
                });
              } else if (isCompletedTransition) {
                await notificationService.notify(student, 'live_class_completed', {
                  courseName
                });
              } else if (isRecordingAvailableTransition) {
                await notificationService.notify(student, 'recording_available', {
                  courseName,
                  recordingLink: recordingUrl
                });
              }
            } catch (studentErr) {
              console.error(`Failed to send status transition notification to student ${student._id}:`, studentErr.message);
            }
          }
        } catch (notifErr) {
          console.error('Error in background live class status transition notifications:', notifErr.message);
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: liveClassObj
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete a live class
// @route   DELETE /api/teacher/live-classes/:id
// @access  Private (Teacher)
export const deleteLiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return res.status(404).json({
        status: 'error',
        message: 'Live class not found'
      });
    }

    // Check permissions
    if (liveClass.teacherId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this class'
      });
    }

    await LiveClass.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Live class deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get teacher user notifications
// @route   GET /api/teacher/user-notifications
// @access  Private (Teacher)
export const getTeacherUserNotifications = async (req, res) => {
  try {
    const dbNotifs = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
    const formatted = dbNotifs.map(n => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      section: n.section || 'general',
      read: n.read || false,
      createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString()
    }));

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark teacher notifications as read
// @route   PUT /api/teacher/notifications/mark-read
// @access  Private (Teacher)
export const markTeacherNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const query = { recipient: req.user.id };
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    await Notification.updateMany(query, { $set: { read: true } });

    res.status(200).json({
      status: 'success',
      message: 'Teacher notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

