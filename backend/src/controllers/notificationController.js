import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import NotificationBroadcast from '../models/NotificationBroadcast.js';
import notificationService from '../services/notificationService.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const VALID_TYPES = ['info', 'warning', 'success', 'error'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const VALID_SCOPES = ['all', 'course', 'individual'];

/**
 * Resolve the list of courses a teacher is allowed to send notifications for.
 * Mirrors the ownership logic used across teacherController.
 */
const getTeacherCourseIds = async (user) => {
  const courses = await Course.find({
    $or: [
      { instructor: user.id },
      { instructor: user.name },
      { _id: { $in: user.teacherInfo?.assignedCourses || [] } }
    ]
  }).select('_id');
  return courses.map(c => c._id.toString());
};

/**
 * Resolve the recipient student documents for a given audience scope.
 * Returns { recipients, courseName, studentName } or throws a {status, message} error.
 */
const resolveRecipients = async ({ scope, courseId, studentId, user, isTeacher }) => {
  if (scope === 'all') {
    if (isTeacher) {
      throw { status: 403, message: 'Teachers cannot send notifications to all students. Please select a course or student.' };
    }
    const recipients = await User.find({
      role: { $in: ['student', 'teacher', 'parent'] },
      isActive: true
    });
    return { recipients, courseName: '', studentName: '' };
  }

  if (scope === 'course') {
    if (!courseId) {
      throw { status: 400, message: 'A target course is required for course notifications' };
    }
    const course = await Course.findById(courseId);
    if (!course) {
      throw { status: 404, message: 'Target course not found' };
    }
    if (isTeacher) {
      const allowed = await getTeacherCourseIds(user);
      if (!allowed.includes(courseId.toString())) {
        throw { status: 403, message: 'You can only send notifications to courses you teach' };
      }
    }
    const enrollments = await Enrollment.find({ courseId, status: 'active' }).populate('studentId');
    const students = enrollments
      .map(e => e.studentId)
      .filter(s => s && s.role === 'student' && s.isActive);

    const studentIds = students.map(s => s._id);
    const parents = await User.find({
      role: 'parent',
      'parentInfo.studentId': { $in: studentIds },
      isActive: true
    });

    const recipients = [...students, ...parents];
    return { recipients, courseName: course.title, studentName: '' };
  }

  if (scope === 'individual') {
    if (!studentId) {
      throw { status: 400, message: 'A target student is required for individual notifications' };
    }
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw { status: 404, message: 'Target student not found' };
    }
    if (isTeacher) {
      const allowed = await getTeacherCourseIds(user);
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId: { $in: allowed }
      });
      if (!enrollment) {
        throw { status: 403, message: 'You can only message students enrolled in your courses' };
      }
    }

    const parents = await User.find({
      role: 'parent',
      'parentInfo.studentId': studentId,
      isActive: true
    });

    const recipients = [student, ...parents];
    return { recipients, courseName: '', studentName: student.name };
  }

  throw { status: 400, message: 'Invalid audience scope' };
};

// @desc    Create & send a notification broadcast (admin or teacher)
// @route   POST /api/admin/notifications  |  POST /api/teacher/notifications
// @access  Private (Admin, Teacher)
export const createNotification = async (req, res) => {
  try {
    const isTeacher = req.user.role === 'teacher';
    let {
      title,
      message,
      type = 'info',
      priority = 'normal',
      audienceScope,
      courseId,
      studentId,
      expiryDate,
      scheduledAt,
      attachmentBase64,
      attachmentName
    } = req.body;

    // --- Validation ---
    if (!title || !title.trim()) {
      return res.status(400).json({ status: 'error', message: 'Notification title is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ status: 'error', message: 'Notification message is required' });
    }
    if (!VALID_SCOPES.includes(audienceScope)) {
      return res.status(400).json({ status: 'error', message: 'A valid audience (all / course / individual) is required' });
    }
    if (!VALID_TYPES.includes(type)) type = 'info';
    if (!VALID_PRIORITIES.includes(priority)) priority = 'normal';

    // --- Resolve recipients (also enforces role permissions) ---
    let recipients, courseName, studentName;
    try {
      ({ recipients, courseName, studentName } = await resolveRecipients({
        scope: audienceScope,
        courseId,
        studentId,
        user: req.user,
        isTeacher
      }));
    } catch (permErr) {
      if (permErr && permErr.status) {
        return res.status(permErr.status).json({ status: 'error', message: permErr.message });
      }
      throw permErr;
    }

    // Section: admin "all" => system; course scope => course; otherwise general
    const section = audienceScope === 'all' ? 'system' : (audienceScope === 'course' ? 'course' : 'general');

    // --- Handle Attachment Upload if provided ---
    let attachment = undefined;
    if (attachmentBase64 && attachmentName) {
      try {
        console.log(`📎 Uploading attachment "${attachmentName}" to Cloudinary...`);
        const uploadResult = await uploadToCloudinary(attachmentBase64, 'announcements');
        attachment = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          name: attachmentName
        };
      } catch (uploadErr) {
        console.error('❌ Attachment upload failed:', uploadErr.message);
        return res.status(500).json({ status: 'error', message: `Attachment upload failed: ${uploadErr.message}` });
      }
    }

    // --- Determine Scheduling Status ---
    let broadcastStatus = 'queued';
    let scheduleDate = undefined;
    if (scheduledAt) {
      const parsedSchedule = new Date(scheduledAt);
      if (!isNaN(parsedSchedule.getTime()) && parsedSchedule > new Date()) {
        broadcastStatus = 'scheduled';
        scheduleDate = parsedSchedule;
      }
    }

    let parsedExpiry = undefined;
    if (expiryDate) {
      const parsed = new Date(expiryDate);
      if (!isNaN(parsed.getTime())) {
        parsedExpiry = parsed;
      }
    }

    // --- Record the broadcast in history first ---
    const broadcast = await NotificationBroadcast.create({
      senderId: req.user.id,
      senderName: req.user.name,
      senderRole: req.user.role,
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      section,
      audienceScope,
      courseId: audienceScope === 'course' ? courseId : undefined,
      courseName,
      studentId: audienceScope === 'individual' ? studentId : undefined,
      studentName,
      recipientCount: recipients.length,
      status: broadcastStatus,
      expiryDate: parsedExpiry,
      scheduledAt: scheduleDate,
      attachment
    });

    if (broadcastStatus === 'scheduled') {
      return res.status(201).json({
        status: 'success',
        message: `Notification scheduled for ${scheduleDate.toLocaleString('en-IN')}.`,
        data: broadcast
      });
    }

    // Respond right away; per-student delivery happens in the background.
    res.status(201).json({
      status: 'success',
      message: recipients.length > 0
        ? `Notification queued for ${recipients.length} user${recipients.length === 1 ? '' : 's'}.`
        : 'Notification saved, but no matching active users were found.',
      data: broadcast
    });

    // --- Background fan-out through the EXISTING notification pipeline ---
    setImmediate(async () => {
      try {
        await notificationService.processBroadcast(broadcast);
      } catch (sendErr) {
        console.error(`Failed to process broadcast notification ${broadcast._id}:`, sendErr.message);
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    List sent notification broadcasts (history) with search / filter / pagination
// @route   GET /api/admin/notifications  |  GET /api/teacher/notifications
// @access  Private (Admin, Teacher)
export const listNotifications = async (req, res) => {
  try {
    const isTeacher = req.user.role === 'teacher';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, type, scope } = req.query;

    const query = {};
    // Teachers only ever see their own sent history. Admin sees everything.
    if (isTeacher) {
      query.senderId = req.user.id;
    }
    if (type && VALID_TYPES.includes(type)) {
      query.type = type;
    }
    if (scope && VALID_SCOPES.includes(scope)) {
      query.audienceScope = scope;
    }
    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      query.$or = [{ title: regex }, { message: regex }, { courseName: regex }];
    }

    const [items, total] = await Promise.all([
      NotificationBroadcast.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('courseId', 'title')
        .populate('studentId', 'name email'),
      NotificationBroadcast.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      results: items.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      },
      data: items
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
