import ApprovalRequest from '../models/ApprovalRequest.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import notificationService from '../services/notificationService.js';

// @desc    Submit teacher or parent approval request
// @route   POST /api/approvals/request
// @access  Public
export const submitApprovalRequest = async (req, res) => {
  try {
    const { name, email, phone, password, requestedRole, parentInfo, teacherInfo } = req.body;

    // Validate role
    if (!['teacher', 'parent'].includes(requestedRole)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be teacher or parent'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email,
        phone,
        password,
        role: requestedRole,
        approvalStatus: 'pending'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await ApprovalRequest.findOne({
      userId: user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a pending approval request'
      });
    }

    // Create approval request
    const approvalRequest = await ApprovalRequest.create({
      userId: user._id,
      email,
      name,
      phone,
      requestedRole,
      parentInfo: requestedRole === 'parent' ? parentInfo : undefined,
      teacherInfo: requestedRole === 'teacher' ? teacherInfo : undefined,
      status: 'pending'
    });

    // Link approval request to user
    user.approvalRequest = approvalRequest._id;
    user.approvalStatus = 'pending';
    await user.save();

    res.status(201).json({
      status: 'success',
      message: 'Approval request submitted successfully',
      data: {
        approvalRequest
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all approval requests (admin only)
// @route   GET /api/approvals/requests
// @access  Private/Admin
export const getAllApprovalRequests = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const requests = await ApprovalRequest.find(query)
      .populate('userId', 'name email phone')
      .sort('-requestedAt');

    res.status(200).json({
      status: 'success',
      data: {
        count: requests.length,
        requests
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Approve or reject approval request (admin only)
// @route   PUT /api/approvals/:requestId
// @access  Private/Admin
export const updateApprovalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Action must be approve or reject'
      });
    }

    const approvalRequest = await ApprovalRequest.findById(requestId).populate('userId');

    if (!approvalRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Approval request not found'
      });
    }

    if (approvalRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'This request has already been processed'
      });
    }

    const user = approvalRequest.userId;

    if (action === 'approve') {
      if (approvalRequest.requestedRole === 'parent') {

  if (!approvalRequest.parentInfo?.studentEmail) {
    return res.status(400).json({
      status: 'error',
      message: 'Parent request is missing student information'
    });
  }

  const student = await User.findOne({
    email: approvalRequest.parentInfo.studentEmail,
    role: 'student',
    isActive: true
  });

  if (!student) {
    return res.status(400).json({
      status: 'error',
      message: `Student account with email ${approvalRequest.parentInfo.studentEmail} not found`
    });
  }

  // Save linkage in approval request
  approvalRequest.parentInfo.studentId = student._id;

  // Save linkage in parent user account
  user.parentInfo = {
    studentId: student._id,
    studentName: student.name,
    relationship:
      approvalRequest.parentInfo.relationship || 'guardian'
  };
}
      // Update approval request
      approvalRequest.status = 'approved';
      // Safely set approvedBy if user info is available
      approvalRequest.approvedBy = req.user && req.user.id ? req.user.id : null;
      approvalRequest.approvedAt = Date.now();
      await approvalRequest.save();

      // Update user
      user.approvalStatus = 'approved';
      user.role = approvalRequest.requestedRole;

      // Assign permissions based on role
      const permissions = await Permission.findOne({ role: approvalRequest.requestedRole });
      if (permissions) {
        user.permissions = permissions._id;
      }

      await user.save();

      // Generate a fresh JWT for the updated role
      const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

      // Send approval email
      const emailMessage = `
        <h1>Access Request Approved</h1>
        <p>Congratulations! Your ${approvalRequest.requestedRole} access request has been approved.</p>
        <p>You can now login with your credentials.</p>
        <p>If you have any questions, please contact support.</p>
      `;

      // Trigger approval notification (In-app, WhatsApp, Email)
      try {
        await notificationService.notify(user, 'account_approved', { role: approvalRequest.requestedRole });
      } catch (emailErr) {
        console.error('⚠️ Approval notification failed:', emailErr.message);
      }

      res.status(200).json({
        status: 'success',
        message: 'Approval request approved successfully',
        data: { approvalRequest, token: newToken }
      });
    } else {
      // Reject
      approvalRequest.status = 'rejected';
      approvalRequest.rejectionReason = rejectionReason || 'Not specified';
      // Safely set approvedBy if user info is available
      approvalRequest.approvedBy = req.user && req.user.id ? req.user.id : null;
      await approvalRequest.save();

      // Update user
      user.approvalStatus = 'rejected';
      await user.save();

      // Send rejection email
      const emailMessage = `
        <h1>Access Request Rejected</h1>
        <p>Unfortunately, your ${approvalRequest.requestedRole} access request has been rejected.</p>
        <p><strong>Reason:</strong> ${approvalRequest.rejectionReason}</p>
        <p>If you have questions or would like to appeal, please contact support.</p>
      `;

      // Trigger rejection notification (In-app, Email, WhatsApp)
      try {
        await notificationService.notify(user, 'custom', { 
          title: `Access Request Rejected`,
          message: `Unfortunately, your ${approvalRequest.requestedRole} access request has been rejected. Reason: ${approvalRequest.rejectionReason}`
        });
      } catch (emailErr) {
        console.error('⚠️ Rejection notification failed:', emailErr.message);
      }

      res.status(200).json({
        status: 'success',
        message: 'Approval request rejected successfully',
        data: { approvalRequest }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private/Admin
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort('role');

    res.status(200).json({
      status: 'success',
      data: {
        count: permissions.length,
        permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update permissions for a role (admin only)
// @route   PUT /api/permissions/:role
// @access  Private/Admin
export const updatePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (role === 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin permissions are immutable and cannot be modified.'
      });
    }

    let permissionDoc = await Permission.findOne({ role });

    if (!permissionDoc) {
      permissionDoc = new Permission({
        role,
        permissions
      });
    } else {
      // Deep merge permissions
      permissionDoc.permissions = {
        ...permissionDoc.permissions.toObject(),
        ...permissions
      };
    }

    await permissionDoc.save();

    res.status(200).json({
      status: 'success',
      message: 'Permissions updated successfully',
      data: { permissions: permissionDoc }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user permissions
// @route   GET /api/permissions/user/:userId
// @access  Private
export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('permissions');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Import sendEmail
import { sendEmail } from '../utils/sendEmail.js';
