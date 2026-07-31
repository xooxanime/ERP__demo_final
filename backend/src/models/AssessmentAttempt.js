import mongoose from 'mongoose';

const assessmentAttemptSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentQuestion' },
    selectedOptionIndex: { type: Number, default: -1 } // -1 for unanswered
  }],
  status: { type: String, enum: ['started', 'in_progress', 'submitted'], default: 'started', index: true },
  timeRemaining: { type: Number, required: true }, // in seconds
  score: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date
}, { timestamps: true });

assessmentAttemptSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
export default AssessmentAttempt;
