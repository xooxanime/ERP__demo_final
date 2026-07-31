import mongoose from 'mongoose';

/**
 * NotificationBroadcast records a single "send" action performed by an admin or teacher
 * from the Notification Management panel. It is an audit/history record of WHAT was sent
 * and to WHOM (the audience), while the actual per-student delivery still flows through the
 * existing notificationService -> queue -> dispatcher -> channels pipeline (in-app, WhatsApp,
 * email). This avoids creating a parallel notification system.
 */
const notificationBroadcastSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    default: ''
  },
  senderRole: {
    type: String,
    enum: ['admin', 'teacher'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  section: {
    type: String,
    enum: ['general', 'course', 'system'],
    default: 'general'
  },
  // Who the notification was aimed at.
  // 'all'        -> every active student (admin only)
  // 'course'     -> students enrolled in a specific course / batch
  // 'individual' -> a single targeted student
  audienceScope: {
    type: String,
    enum: ['all', 'course', 'individual'],
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  courseName: {
    type: String,
    default: ''
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: {
    type: String,
    default: ''
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['queued', 'scheduled', 'sent', 'failed'],
    default: 'queued'
  },
  expiryDate: {
    type: Date
  },
  scheduledAt: {
    type: Date
  },
  attachment: {
    url: String,
    publicId: String,
    name: String
  }
}, {
  timestamps: true
});

// Optimised history queries (sender's own list, newest first)
notificationBroadcastSchema.index({ senderId: 1, createdAt: -1 });
notificationBroadcastSchema.index({ createdAt: -1 });
notificationBroadcastSchema.index({ status: 1, scheduledAt: 1 });

const NotificationBroadcast = mongoose.model('NotificationBroadcast', notificationBroadcastSchema);

export default NotificationBroadcast;
