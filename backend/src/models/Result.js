import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIAssessment',
    required: true,
    index: true
  },
  type: {
    type: String,
    default: 'General'
  },
  topic: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    default: 0
  },
  weakTopics: {
    type: [String],
    default: []
  },
  strongTopics: {
    type: [String],
    default: []
  },
  suggestions: {
    type: [String],
    default: []
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
