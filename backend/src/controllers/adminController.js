import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import HeroSection from '../models/HeroSection.js';
import LiveClass from '../models/LiveClass.js';
import Batch from '../models/Batch.js';
import { meetingManager } from '../utils/meetingProvider.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { sendEmail } from '../utils/sendEmail.js';
import notificationService from '../services/notificationService.js';

// Access control helper for teachers
const checkTeacherCourseAccess = async (courseId, req) => {
  if (req.user.role === 'admin') return true;
  if (req.user.role !== 'teacher') return false;

  const course = await Course.findById(courseId);
  if (!course) return false;

  // 1. If teacher is the creator/owner of the course
  if (course.creator && course.creator.toString() === req.user.id) {
    return true;
  }

  // 2. Or if the course is in a batch where the teacher is assigned or is the batch manager
  const batch = await Batch.findOne({
    courses: courseId,
    $or: [
      { teachers: req.user.id },
      { batchManager: req.user.id }
    ]
  });
  if (batch) {
    return true;
  }

  // Legacy fallback if creator is not set but instructor matches
  if (!course.creator && !course.batch && course.instructor === req.user.name) {
    return true;
  }

  return false;
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalBatches = await Batch.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    // Calculate total revenue
    const payments = await Payment.find({ status: 'success' });
    const totalRevenue = payments.reduce((acc, payment) => acc + payment.amount, 0);

    // Recent student registrations (last 5)
    const recentStudents = await User.find({ role: 'student' })
      .select('name email isActive enrolledCourses')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent payments (last 5)
    const recentPayments = await Payment.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedPayments = recentPayments.map(p => ({
      id: p._id,
      student: p.studentId?.name || 'Unknown Student',
      course: p.courseId?.title || (p.transactionType ? p.transactionType.toUpperCase() : 'Fees'),
      amount: p.amount,
      status: p.status === 'success' ? 'paid' : p.status,
      date: p.paymentDate || p.createdAt
    }));

    // Course category distribution
    const categoryCounts = {};
    const enrollments = await Enrollment.find().populate('courseId', 'category');
    enrollments.forEach(e => {
      if (e.courseId && e.courseId.category) {
        const cat = e.courseId.category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    });

    const totalEnrollmentsCount = enrollments.length || 1;
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6'];
    const courseDistribution = Object.keys(categoryCounts).map((cat, idx) => ({
      name: cat,
      value: Math.round((categoryCounts[cat] / totalEnrollmentsCount) * 100),
      color: colors[idx % colors.length]
    }));

    if (courseDistribution.length === 0) {
      courseDistribution.push(
        { name: 'CA Foundation', value: 40, color: '#3b82f6' },
        { name: 'CA Inter', value: 35, color: '#8b5cf6' },
        { name: 'CA Final', value: 25, color: '#10b981' }
      );
    }

    // Monthly revenue & enrollment aggregation (last 6 months)
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6MonthsData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const monthNum = date.getMonth();
      
      last6MonthsData.push({
        month: monthsShort[monthNum],
        year,
        monthNum,
        revenue: 0,
        enrollments: 0
      });
    }

    const startOfPeriod = new Date();
    startOfPeriod.setMonth(startOfPeriod.getMonth() - 5);
    startOfPeriod.setDate(1);
    startOfPeriod.setHours(0, 0, 0, 0);

    const successfulPayments = await Payment.find({
      status: 'success',
      paymentDate: { $gte: startOfPeriod }
    });

    successfulPayments.forEach(p => {
      const pDate = new Date(p.paymentDate || p.createdAt);
      const pMonth = pDate.getMonth();
      const pYear = pDate.getFullYear();
      const matched = last6MonthsData.find(m => m.monthNum === pMonth && m.year === pYear);
      if (matched) {
        matched.revenue += p.amount;
      }
    });

    const enrollmentsInPeriod = await Enrollment.find({
      enrollmentDate: { $gte: startOfPeriod }
    });

    enrollmentsInPeriod.forEach(e => {
      const eDate = new Date(e.enrollmentDate || e.createdAt);
      const eMonth = eDate.getMonth();
      const eYear = eDate.getFullYear();
      const matched = last6MonthsData.find(m => m.monthNum === eMonth && m.year === eYear);
      if (matched) {
        matched.enrollments += 1;
      }
    });

    // Recent enrollments for general logs (last 10)
    const recentEnrollments = await Enrollment.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ enrollmentDate: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalStudents,
          totalTeachers,
          totalBatches,
          totalCourses,
          totalEnrollments,
          totalRevenue
        },
        recentEnrollments,
        monthlyRevenue: last6MonthsData,
        recentPayments: formattedPayments,
        recentStudents,
        courseDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/admin/courses
// @access  Private (Admin)
export const createCourse = async (req, res) => {
  try {
    const courseData = req.body;

    // Handle thumbnail upload if provided
    if (req.body.thumbnailBase64) {
      const uploadResult = await uploadToCloudinary(req.body.thumbnailBase64, 'courses/thumbnails');
      courseData.thumbnail = uploadResult;
      delete courseData.thumbnailBase64;
    }

    // Handle QR upload if provided
    if (req.body.paymentQrImageBase64) {
      const uploadResult = await uploadToCloudinary(req.body.paymentQrImageBase64, 'courses/qr');
      courseData.paymentQrImage = uploadResult;
      delete courseData.paymentQrImageBase64;
    }

    const course = await Course.create(courseData);

    res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/admin/courses/:id
// @access  Private (Admin)
export const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    const updateData = req.body;

    // Handle thumbnail update
    if (req.body.thumbnailBase64) {
      // Delete old thumbnail
      if (course.thumbnail.publicId) {
        await deleteFromCloudinary(course.thumbnail.publicId);
      }
      // Upload new thumbnail
      const uploadResult = await uploadToCloudinary(req.body.thumbnailBase64, 'courses/thumbnails');
      updateData.thumbnail = uploadResult;
      delete updateData.thumbnailBase64;
    }

    // Handle QR update
    if (req.body.paymentQrImageBase64) {
      // Delete old QR image
      if (course.paymentQrImage && course.paymentQrImage.publicId) {
        await deleteFromCloudinary(course.paymentQrImage.publicId);
      }
      // Upload new QR
      const uploadResult = await uploadToCloudinary(req.body.paymentQrImageBase64, 'courses/qr');
      updateData.paymentQrImage = uploadResult;
      delete updateData.paymentQrImageBase64;
    }

    course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/admin/courses/:id
// @access  Private (Admin)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Delete thumbnail from cloudinary
    if (course.thumbnail.publicId) {
      await deleteFromCloudinary(course.thumbnail.publicId);
    }

    // Delete all modules and their videos
    const modules = await Module.find({ courseId: course._id });
    for (const module of modules) {
      // Delete videos from cloudinary
      for (const video of module.videos) {
        if (video.publicId) {
          await deleteFromCloudinary(video.publicId);
        }
      }
      // Delete notes from cloudinary
      for (const note of module.notes) {
        if (note.publicId) {
          await deleteFromCloudinary(note.publicId);
        }
      }
      await module.deleteOne();
    }

    await course.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get course with all modules and videos (Admin)
// @route   GET /api/admin/courses/:id/content
// @access  Private (Admin)
export const getCourseContent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(course._id, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        course,
        modules
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add module to course
// @route   POST /api/admin/courses/:id/modules
// @access  Private (Admin)
export const addModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(course._id, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    const moduleData = {
      ...req.body,
      courseId: req.params.id
    };

    const module = await Module.create(moduleData);

    res.status(201).json({
      status: 'success',
      message: 'Module added successfully',
      data: { module }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update module
// @route   PUT /api/admin/modules/:id
// @access  Private (Admin)
export const updateModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        status: 'error',
        message: 'Module not found'
      });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(module.courseId, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    // Update fields
    if (req.body.title) module.title = req.body.title;
    if (req.body.order) module.order = req.body.order;
    await module.save();

    res.status(200).json({
      status: 'success',
      message: 'Module updated successfully',
      data: { module }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/admin/modules/:id
// @access  Private (Admin)
export const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        status: 'error',
        message: 'Module not found'
      });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(module.courseId, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    // Delete videos from cloudinary
    for (const video of module.videos) {
      if (video.publicId) {
        await deleteFromCloudinary(video.publicId);
      }
    }

    // Delete notes from cloudinary
    for (const note of module.notes) {
      if (note.publicId) {
        await deleteFromCloudinary(note.publicId);
      }
    }

    await module.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Module deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add video to module
// @route   POST /api/admin/modules/:id/videos
// @access  Private (Admin)
export const addVideo = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        status: 'error',
        message: 'Module not found'
      });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(module.courseId, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    const videoData = { ...req.body };
    if (videoData.videoUrl && !videoData.url) {
      videoData.url = videoData.videoUrl;
    }

    // Handle video upload if base64 provided
    if (req.body.videoBase64) {
      const uploadResult = await uploadToCloudinary(req.body.videoBase64, 'courses/videos');
      videoData.url = uploadResult.url;
      videoData.publicId = uploadResult.publicId;
      delete videoData.videoBase64;
    }

    module.videos.push(videoData);
    await module.save();

    res.status(201).json({
      status: 'success',
      message: 'Video added successfully',
      data: { module }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add note to module
// @route   POST /api/admin/modules/:id/notes
// @access  Private (Admin)
export const addNote = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        status: 'error',
        message: 'Module not found'
      });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(module.courseId, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    const noteData = req.body;

    // Handle PDF upload if base64 provided
    if (req.body.pdfBase64) {
      const uploadResult = await uploadToCloudinary(req.body.pdfBase64, 'courses/notes');
      noteData.url = uploadResult.url;
      noteData.publicId = uploadResult.publicId;
      delete noteData.pdfBase64;
    }

    module.notes.push(noteData);
    await module.save();

    res.status(201).json({
      status: 'success',
      message: 'Note added successfully',
      data: { module }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete video from module
// @route   DELETE /api/admin/modules/:moduleId/videos/:videoId
// @access  Private (Admin)
export const deleteVideo = async (req, res) => {
  try {
    const { moduleId, videoId } = req.params;
    const module = await Module.findById(moduleId);

    if (!module) {
      return res.status(404).json({ status: 'error', message: 'Module not found' });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(module.courseId, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    const video = module.videos.id(videoId);
    if (!video) {
        return res.status(404).json({ status: 'error', message: 'Video not found' });
    }

    // Delete from Cloudinary
    if (video.publicId) {
      await deleteFromCloudinary(video.publicId);
    }

    video.deleteOne();
    await module.save();

    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully',
      data: { module }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Delete note from module
// @route   DELETE /api/admin/modules/:moduleId/notes/:noteId
// @access  Private (Admin)
export const deleteNote = async (req, res) => {
  try {
    const { moduleId, noteId } = req.params;
    const module = await Module.findById(moduleId);

    if (!module) {
      return res.status(404).json({ status: 'error', message: 'Module not found' });
    }

    // Access control check
    if (!(await checkTeacherCourseAccess(module.courseId, req))) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this course'
      });
    }

    const note = module.notes.id(noteId);
    if (!note) {
        return res.status(404).json({ status: 'error', message: 'Note not found' });
    }

    // Delete from Cloudinary
    if (note.publicId) {
      await deleteFromCloudinary(note.publicId);
    }

    note.deleteOne();
    await module.save();

    res.status(200).json({
      status: 'success',
      message: 'Note deleted successfully',
      data: { module }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get all enrollments
// @route   GET /api/admin/enrollments
// @access  Private (Admin)
export const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('studentId', 'name email phone')
      .populate('courseId', 'title category price')
      .populate('paymentId')
      .sort({ enrollmentDate: -1 });

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

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: { $regex: /^student$/i } })
      .populate('enrolledCourses', 'title category')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: students.length,
      data: { students }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update student status
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
export const updateStudentStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { isActive },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { student }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update hero section
// @route   PUT /api/admin/hero-section
// @access  Private (Admin)
export const updateHeroSection = async (req, res) => {
  try {
    let heroSection = await HeroSection.findOne();

    const updateData = req.body;

    // Handle banner image upload
    if (req.body.bannerImageBase64) {
      if (heroSection && heroSection.bannerImage.publicId) {
        await deleteFromCloudinary(heroSection.bannerImage.publicId);
      }
      const uploadResult = await uploadToCloudinary(req.body.bannerImageBase64, 'hero');
      updateData.bannerImage = uploadResult;
      delete updateData.bannerImageBase64;
    }

    if (heroSection) {
      heroSection = await HeroSection.findByIdAndUpdate(
        heroSection._id,
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      heroSection = await HeroSection.create(updateData);
    }

    res.status(200).json({
      status: 'success',
      message: 'Hero section updated successfully',
      data: { heroSection }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get hero section
// @route   GET /api/admin/hero-section
// @access  Public
export const getHeroSection = async (req, res) => {
  try {
    let heroSection = await HeroSection.findOne({ isActive: true });

    if (!heroSection) {
      // Create default hero section
      heroSection = await HeroSection.create({});
    }

    res.status(200).json({
      status: 'success',
      data: { heroSection }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all pending payments
// @route   GET /api/admin/payments/pending
// @access  Private (Admin)
export const getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('studentId', 'name email phone')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: { payments }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Verify pending payment
// @route   PUT /api/admin/payments/:id/verify
// @access  Private (Admin)
export const verifyPayment = async (req, res) => {
  try {
    const { status } = req.body; // 'success' or 'failed'
    
    if (!['success', 'failed'].includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment has already been processed'
      });
    }

    // Check if student and course exist before approving
    if (status === 'success') {
      const userExists = await User.exists({ _id: payment.studentId });
      if (!userExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot approve payment: The associated student profile no longer exists.'
        });
      }

      const courseExists = await Course.exists({ _id: payment.courseId });
      if (!courseExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot approve payment: The associated course no longer exists.'
        });
      }
    }

    payment.status = status;
    payment.paymentDate = Date.now();
    await payment.save();

    if (status === 'success') {
      // Calculate expiry date (exactly 12 months from now)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 12);

      // Create enrollment
      const enrollment = await Enrollment.create({
        studentId: payment.studentId,
        courseId: payment.courseId,
        paymentId: payment._id,
        status: 'active',
        expiryDate
      });

      // Update course enrolled students count
      await Course.findByIdAndUpdate(payment.courseId, {
        $inc: { enrolledStudents: 1 }
      });

      // Update user's enrolled courses
      await User.findByIdAndUpdate(payment.studentId, {
        $push: { enrolledCourses: payment.courseId }
      });

      // Send Email
      const course = await Course.findById(payment.courseId);
      const user = await User.findById(payment.studentId);
      
      if (user && course) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Enrollment Successful! 🎉</h2>
            <p>Dear ${user.name},</p>
            <p>Your payment has been verified by the admin. You have successfully purchased the course.</p>
            <p>Your course access is valid for exactly 12 months (until ${expiryDate.toLocaleDateString()}).</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${course.title}</h3>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${course.category}</p>
              <p style="margin: 5px 0;"><strong>Instructor:</strong> ${course.instructor}</p>
              <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${payment.amount}</p>
            </div>
            <p>You can now access the course content from your dashboard.</p>
            <a href="${process.env.FRONTEND_URL}/student/my-courses" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Go to My Courses
            </a>
            <p>Happy Learning!</p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              If you have any questions, feel free to contact our support team.
            </p>
          </div>
        `;

        await notificationService.notify(user, 'payment_success', {
          courseName: course.title,
          amount: payment.amount,
          receiptId: payment.utrNumber,
          html: emailHtml
        });
      }
    } else {
       const user = await User.findById(payment.studentId);
       const course = await Course.findById(payment.courseId);
       
       if (user && course) {
         const emailHtml = `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
           <h2 style="color: #DC2626;">Payment Verification Failed</h2>
           <p>Dear ${user.name},</p>
           <p>Your manual UTR payment for the course <strong>${course.title}</strong> could not be verified.</p>
           <p>Please double-check your UTR number or contact our support team for assistance.</p>
         </div>
         `;
         await notificationService.notify(user, 'payment_failed', {
          courseName: course.title,
          reason: 'Incorrect UTR number or mismatch in reference logs',
          html: emailHtml
         });
       }
    }

    res.status(200).json({
      status: 'success',
      message: `Payment marked as ${status} successfully`,
      data: { payment }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all live classes for admin
// @route   GET /api/admin/live-classes
// @access  Private (Admin)
export const getAdminLiveClasses = async (req, res) => {
  try {
    const liveClasses = await LiveClass.find()
      .populate('courseId', 'title')
      .populate('teacherId', 'name')
      .sort({ startTime: 1 });

    const formattedClasses = liveClasses.map(lc => {
      const lcObj = lc.toObject();
      const rawRoomId = lc.meetingLink;
      if (lcObj.meetingLink && !lcObj.meetingLink.startsWith('http')) {
        lcObj.meetingLink = meetingManager.getUrl(lcObj.meetingLink);
      }
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

// @desc    Create a new live class as admin
// @route   POST /api/admin/live-classes
// @access  Private (Admin)
export const createAdminLiveClass = async (req, res) => {
  try {
    const { title, description, courseId, teacherId, startTime, endTime } = req.body;

    if (!courseId) {
      return res.status(400).json({
        status: 'error',
        message: 'A course is required to schedule a live class'
      });
    }

    if (!teacherId) {
      return res.status(400).json({
        status: 'error',
        message: 'A conducting teacher is required to schedule a live class'
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

    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({
        status: 'error',
        message: 'Conducting teacher not found'
      });
    }

    const meetingData = meetingManager.generateMeeting(course.title);
    const roomId = meetingData.roomId;

    const liveClass = await LiveClass.create({
      teacherId,
      courseId,
      title,
      description,
      meetingLink: roomId,
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

    // Trigger scheduled class notifications in background
    setImmediate(async () => {
      try {
        const enrollments = await Enrollment.find({ courseId }).populate('studentId');
        const students = enrollments.map(e => e.studentId).filter(s => s && s.role === 'student');
        const courseName = course.title;
        for (const student of students) {
          try {
            await notificationService.notify(student, 'live_class_scheduled', {
              courseName,
              teacherName: teacher.name,
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

// @desc    Get admin user notifications
// @route   GET /api/admin/user-notifications
// @access  Private (Admin)
export const getAdminUserNotifications = async (req, res) => {
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

// @desc    Mark admin notifications as read
// @route   PUT /api/admin/notifications/mark-read
// @access  Private (Admin)
export const markAdminNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const query = { recipient: req.user.id };
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    await Notification.updateMany(query, { $set: { read: true } });

    res.status(200).json({
      status: 'success',
      message: 'Admin notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
