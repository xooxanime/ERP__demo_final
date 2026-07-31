import User from '../models/User.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import Permission from '../models/Permission.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import notificationService from '../services/notificationService.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register a new user (student, teacher, or parent)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'student', teacherInfo, parentInfo } = req.body;

    // Validate role
    if (!['student', 'teacher', 'parent'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be student, teacher, or parent'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Determine approval status based on role
    let approvalStatus = 'auto-approved'; // Students auto-approved
    if (role === 'teacher' || role === 'parent') {
      approvalStatus = 'pending'; // Teachers and parents need approval
    }

    // Create user with role-specific data
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      approvalStatus,
      teacherInfo: role === 'teacher' ? teacherInfo : undefined,
      parentInfo: role === 'parent' ? parentInfo : undefined
    });

    // If teacher or parent, create approval request
    if (role === 'teacher' || role === 'parent') {
      const approvalRequest = await ApprovalRequest.create({
        userId: user._id,
        email,
        name,
        phone,
        requestedRole: role,
        status: 'pending',
        teacherInfo: role === 'teacher' ? teacherInfo : undefined,
        parentInfo: role === 'parent' ? parentInfo : undefined
      });

      user.approvalRequest = approvalRequest._id;
      await user.save();

      // Send email notification
      const emailMessage = `
        <h1>Account Created - Pending Admin Approval</h1>
        <p>Dear ${name},</p>
        <p>Thank you for registering as a ${role} on Shri Education ERP.</p>
        <p>Your account has been created and is now awaiting admin approval. You will receive an email notification once your access is approved or rejected.</p>
        <p>This process typically takes 24-48 hours.</p>
        <p>Best regards,<br/>Shri Education Team</p>
      `;

      try {
        await sendEmail({
          to: email,
          subject: 'Account Created - Pending Admin Approval',
          html: emailMessage
        });
      } catch (error) {
        console.error('Error sending email:', error);
      }
    // Trigger welcome/registration notifications (In-app, Email, WhatsApp)
    try {
      await notificationService.notify(user, 'welcome_verification', { role });
    } catch (notifErr) {
      console.error('Welcome notification failed:', notifErr.message);
    }
  } else {
    // Also trigger welcome notification for students (who don't require approval)
    try {
      await notificationService.notify(user, 'welcome_verification', { role });
    } catch (notifErr) {
      console.error('Student welcome notification failed:', notifErr.message);
    }
  }

    // For students, generate token for immediate login
    let token = null;
    if (role === 'student') {
      token = generateToken(user._id);
    }

    res.status(201).json({
      status: 'success',
      message: role === 'student' 
        ? 'Registration successful' 
        : 'Registration successful. Waiting for admin approval.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          approvalStatus: user.approvalStatus
        },
        token: token || null
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Login user with role selection
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password').populate('permissions');
    console.log('User found:', user ? `Yes (Role: ${user.role})` : 'No');
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // If teacher or parent role in DB, check approval status
    if ((user.role === 'teacher' || user.role === 'parent') && user.role !== 'admin') {
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({
          status: 'error',
          message: 'Your access request is pending approval from admin'
        });
      }
      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({
          status: 'error',
          message: 'Your access request has been rejected'
        });
      }
    }

    // Determine final role to use from database
    const finalRole = user.role;

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: finalRole,
          avatar: user.avatar,
          approvalStatus: user.approvalStatus,
          permissions: user.permissions
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('permissions')
      .populate('parentInfo.studentId', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          approvalStatus: user.approvalStatus,
          enrolledCourses: user.enrolledCourses,

          // Parent data
          parentInfo: user.parentInfo,

          // Teacher data
          teacherInfo: user.teacherInfo,

          // Permissions
          permissions: user.permissions
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>This link will expire in 30 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
      await notificationService.notify(user, 'password_reset', { resetLink: resetUrl });

      res.status(200).json({
        status: 'success',
        message: 'Password reset notification sent'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        status: 'error',
        message: 'Notification could not be sent'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, notificationPreferences } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          notificationPreferences: user.notificationPreferences
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
