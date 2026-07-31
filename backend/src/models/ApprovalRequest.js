import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['teacher', 'parent'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String,
    default: ''
  },
  parentInfo: {
    studentName: String,
    studentEmail: String,
    relationship: {
      type: String,
      enum: ['mother', 'father', 'guardian', 'other'],
      default: 'guardian'
    },
    studentId: mongoose.Schema.Types.ObjectId
  },
  teacherInfo: {
    qualifications: String,
    experience: String,
    specialization: String,
    department: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  requestedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);

export default ApprovalRequest;
