import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import notificationDispatcher from './notificationDispatcher.js';
import queueService from './queueService.js';
import mongoose from 'mongoose';

class NotificationService {
  /**
   * Primary method to trigger a notification event for a user.
   * Resolves recipient and formats appropriate event payloads.
   */
  async notify(userIdOrUser, erpEvent, data = {}) {
    try {
      let recipientUser = null;
      if (userIdOrUser) {
        if (userIdOrUser.email && userIdOrUser.role) {
          recipientUser = userIdOrUser;
        } else {
          recipientUser = await User.findById(userIdOrUser);
        }
      }

      if (!recipientUser) {
        console.warn(`⚠️ NotificationService: Recipient user not found for event: ${erpEvent}`);
        return null;
      }

      const payload = this._buildPayload(erpEvent, recipientUser, data);

      const jobData = {
        recipientId: recipientUser._id,
        erpEvent,
        payload,
        triggerUserId: data.triggerUserId || null,
        ipAddress: data.ipAddress || '127.0.0.1',
        userAgent: data.userAgent || 'Server Script',
        correlationId: data.correlationId || null
      };

      const results = await queueService.enqueueNotification(jobData);

      // Handle Parent notifications if child attendance/performance/fees are marked
      if (recipientUser.role === 'student' && this._shouldNotifyParent(erpEvent)) {
        await this.notifyLinkedParents(recipientUser._id, erpEvent, data);
      }

      return results;
    } catch (err) {
      console.error(`❌ NotificationService Notify Exception (Event: ${erpEvent}):`, err.message);
      return null;
    }
  }

  /**
   * Helper to dispatch notifications to parents linked to a student.
   */
  async notifyLinkedParents(studentId, childEvent, data = {}) {
    try {
      const student = await User.findById(studentId);
      const parents = await User.find({
        role: 'parent',
        'parentInfo.studentId': studentId
      });

      if (!parents || parents.length === 0) return;

      const parentEvent = `${childEvent}_parent`;
      for (const parent of parents) {
        const parentData = {
          ...data,
          childName: student.name,
          parentName: parent.name
        };
        await this.notify(parent, parentEvent, parentData);
      }
    } catch (err) {
      console.error('❌ NotificationService Parent Notify Exception:', err.message);
    }
  }

  /**
   * Check if a student event should also be triggered to parents.
   */
  _shouldNotifyParent(erpEvent) {
    const parentTriggerEvents = [
      'attendance_alert',
      'low_attendance_warning',
      'fee_reminder',
      'payment_failed',
      'live_class_reminder',
      'live_class_started'
    ];
    return parentTriggerEvents.includes(erpEvent);
  }

  /**
   * Maps ERP event details to payload structure.
   */
  _buildPayload(event, recipient, data) {
    let title = 'System Notification';
    let message = 'You have a new update from Shri Education ERP.';
    let type = 'info';
    let section = 'general';
    let courseName = data.courseName || '';

    switch (event) {
      // Authentication / Approvals
      case 'welcome_verification':
        title = 'Welcome to Shri Education ERP';
        message = `Your account has been created for the role of ${data.role || recipient.role}. Admin approval is pending.`;
        type = 'success';
        section = 'system';
        break;

      case 'account_approved':
        title = 'Account Approved Successfully';
        message = `Dear ${recipient.name}, your account registration has been approved. You are ready to log in.`;
        type = 'success';
        section = 'system';
        break;

      case 'password_reset':
        title = 'Password Reset Request';
        message = `A password reset link was requested. Please use: ${data.resetLink}`;
        type = 'warning';
        section = 'system';
        break;

      case 'account_activated':
        title = 'Account Activated';
        message = `Your CA E-Learning portal account has been successfully activated.`;
        type = 'success';
        section = 'system';
        break;

      // Live Classes
      case 'live_class_scheduled':
        title = `Live Class Scheduled: ${courseName}`;
        message = `A live class is scheduled for "${courseName}" on ${data.date} at ${data.time}.`;
        type = 'info';
        section = 'course';
        break;

      case 'live_class_reminder':
        title = `Live Class Starting Soon: ${courseName}`;
        message = `Reminder: Live class for "${courseName}" starts in 15 minutes. Join now: ${data.meetingLink}`;
        type = 'warning';
        section = 'course';
        break;

      case 'live_class_started':
        title = `Class Live Now: ${courseName}`;
        message = `The live class for "${courseName}" is now active. Instructor: ${data.teacherName}. Click to join.`;
        type = 'success';
        section = 'course';
        break;

      case 'live_class_cancelled':
        title = `Class Cancelled: ${courseName}`;
        message = `The live session for "${courseName}" scheduled on ${data.date} at ${data.time} is cancelled.`;
        type = 'error';
        section = 'course';
        break;

      case 'live_class_completed':
        title = `Class Completed: ${courseName}`;
        message = `The live session for "${courseName}" has ended.`;
        type = 'info';
        section = 'course';
        break;

      case 'recording_available':
        title = `Recording Available: ${courseName}`;
        message = `The video recording for class session "${courseName}" is now uploaded.`;
        type = 'success';
        section = 'course';
        break;

      // Attendance
      case 'attendance_alert':
        title = 'Attendance Record Updated';
        message = `You were marked ${data.status || 'present'} for class on ${data.date}.`;
        type = 'info';
        section = 'general';
        break;

      case 'attendance_alert_parent':
        title = `Attendance Alert: ${data.childName}`;
        message = `Your child ${data.childName} was marked ${data.status || 'present'} for class on ${data.date}.`;
        type = 'info';
        section = 'general';
        break;

      case 'low_attendance_warning':
        title = `Low Attendance Warn: ${courseName}`;
        message = `Your activity log in "${courseName}" has dropped to ${data.percentage}%. Please join live sessions.`;
        type = 'warning';
        section = 'course';
        break;

      case 'low_attendance_warning_parent':
        title = `Low Attendance Notice: ${data.childName}`;
        message = `Your child ${data.childName}'s attendance in "${courseName}" is at ${data.percentage}%, below recommended levels.`;
        type = 'warning';
        section = 'course';
        break;

      // Assignments
      case 'assignment_posted':
        title = `New Assignment: ${courseName}`;
        message = `A new assignment "${data.assignmentTitle}" has been posted. Deadline is ${data.deadline}.`;
        type = 'info';
        section = 'course';
        break;

      case 'assignment_deadline':
        title = `Assignment Deadline Approaching: ${courseName}`;
        message = `Reminder: Only ${data.hoursLeft || '24'} hours left to submit your assignment "${data.assignmentTitle}".`;
        type = 'warning';
        section = 'course';
        break;

      // Payments
      case 'fee_reminder':
        title = 'Fee Outstanding Reminder';
        message = `Reminder: Outstanding payment of ₹${data.amount} is due by ${data.dueDate}.`;
        type = 'warning';
        section = 'general';
        break;

      case 'fee_reminder_parent':
        title = `Fee Outstanding Reminder: ${data.childName}`;
        message = `Reminder: Pending invoice of ₹${data.amount} for your child ${data.childName} is due on ${data.dueDate}.`;
        type = 'warning';
        section = 'general';
        break;

      case 'payment_success':
        title = 'Payment Successful';
        message = `We verified your payment of ₹${data.amount} for "${courseName}". Receipt: ${data.receiptId}`;
        type = 'success';
        section = 'general';
        break;

      case 'payment_failed':
        title = 'Payment Verification Failed';
        message = ` manual verification for UTR verification in "${courseName}" could not be confirmed.`;
        type = 'error';
        section = 'general';
        break;

      case 'payment_failed_parent':
        title = `Manual Verification Failed: ${data.childName}`;
        message = `Manual fee receipt verification for UTR verification for ${data.childName} could not be confirmed.`;
        type = 'error';
        section = 'general';
        break;

      // Announcements & Broadcasts (admin / teacher manual notifications)
      case 'announcement':
        title = data.title || 'Academy Announcement';
        message = data.message || 'There is a new system announcement posted.';
        type = data.type || 'info';
        section = data.section || (courseName ? 'course' : 'general');
        break;

      default:
        title = data.title || 'ERP Notification';
        message = data.message || 'You have received an ERP system notice.';
        type = 'info';
        section = 'general';
        break;
    }

    // Ensure templateData is formatted correctly for WhatsApp templates mapping
    const templateData = {
      name: recipient.name,
      role: recipient.role,
      email: recipient.email,
      courseName,
      ...data
    };

    return {
      title,
      message,
      type,
      section,
      priority: data.priority || 'normal',
      courseName,
      erpEvent: event,
      templateData,
      expiryDate: data.expiryDate || null,
      attachment: data.attachment || null
    };
  }

  /**
   * Background fan-out for a NotificationBroadcast.
   * Resolves recipients, creates individual Notification records, enqueues WhatsApp logs, and updates broadcast status.
   */
  async processBroadcast(broadcast) {
    try {
      const isTeacher = broadcast.senderRole === 'teacher';
      const audienceScope = broadcast.audienceScope;
      const courseId = broadcast.courseId;
      const studentId = broadcast.studentId;

      const User = mongoose.model('User');
      const Enrollment = mongoose.model('Enrollment');

      let recipients = [];
      let courseName = broadcast.courseName || '';

      if (audienceScope === 'all') {
        // Global broadcast
        // Notify all parents, students, and teachers
        recipients = await User.find({
          role: { $in: ['student', 'teacher', 'parent'] },
          isActive: true
        });
      } else if (audienceScope === 'course') {
        // Course scoped broadcast
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

        // Combined unique set of recipients
        recipients = [...students, ...parents];
      } else if (audienceScope === 'individual') {
        // Individual student broadcast
        const student = await User.findById(studentId);
        if (student && student.role === 'student' && student.isActive) {
          const parents = await User.find({
            role: 'parent',
            'parentInfo.studentId': studentId,
            isActive: true
          });
          recipients = [student, ...parents];
        }
      }

      let delivered = 0;
      for (const recipient of recipients) {
        try {
          const notificationData = {
            title: broadcast.title,
            message: broadcast.message,
            type: broadcast.type,
            section: broadcast.section,
            priority: broadcast.priority,
            courseName: broadcast.courseName,
            triggerUserId: broadcast.senderId,
            expiryDate: broadcast.expiryDate || null,
            attachment: broadcast.attachment || null
          };

          await this.notify(recipient, 'announcement', notificationData);
          delivered++;
        } catch (sendErr) {
          console.error(`Failed to dispatch broadcast notification to recipient ${recipient._id}:`, sendErr.message);
        }
      }

      broadcast.recipientCount = recipients.length;
      broadcast.status = delivered > 0 ? 'sent' : 'failed';
      await broadcast.save();

      console.log(`✅ Broadcast "${broadcast.title}" processed successfully. Sent to ${delivered}/${recipients.length} recipients.`);
    } catch (err) {
      console.error(`❌ processBroadcast failed for broadcast ${broadcast._id}:`, err.message);
      broadcast.status = 'failed';
      await broadcast.save();
    }
  }
}

export default new NotificationService();
