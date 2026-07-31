import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

// @desc    Create manual payment via UTR
// @route   POST /api/payment/manual-payment
// @access  Private (Student)
export const createManualPayment = async (req, res) => {
  try {
    const { courseId, utrNumber } = req.body;

    if (!utrNumber) {
        return res.status(400).json({ status: 'error', message: 'Please provide a UTR number' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already enrolled in this course'
      });
    }

    // Check if there is already a pending payment for this course by this student
    const pendingPayment = await Payment.findOne({
        studentId: req.user.id,
        courseId,
        status: 'pending'
    });

    if (pendingPayment) {
        return res.status(400).json({
            status: 'error', 
            message: 'You already have a pending payment for this course. Please wait for admin verification.'
        });
    }

    // Check if this UTR number has been used before (globally)
    const existingPayment = await Payment.findOne({ utrNumber });
    if (existingPayment) {
        return res.status(400).json({ status: 'error', message: 'This UTR number has already been submitted.' });
    }

    // Calculate final amount
    const amount = course.finalPrice;

    // Create payment record
    const payment = await Payment.create({
      studentId: req.user.id,
      courseId,
      utrNumber,
      amount,
      status: 'pending',
      paymentMethod: 'manual_utr'
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment details submitted successfully. Access will be granted once the admin verifies your UTR number.',
      data: { payment }
    });
  } catch (error) {
    if(error.code === 11000) {
        return res.status(400).json({ status: 'error', message: 'This UTR number has already been submitted.' });
    }
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payment/history
// @access  Private (Student)
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ studentId: req.user.id })
      .populate('courseId', 'title thumbnail')
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
