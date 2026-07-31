import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    default: ''
  },
  attachments: [{
    title: String,
    url: String
  }],
  status: {
    type: String,
    enum: ['submitted', 'graded', 'pending', 'late', 'returned'],
    default: 'submitted'
  },
  grade: {
    type: String,
    default: ''
  },
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure a student can submit only once per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
