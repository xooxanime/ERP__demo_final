import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MCQ', 'Coding', 'mcq', 'coding'],
    default: 'MCQ'
  },
  question: String,
  options: [String],
  correctAnswer: String,
  answer: String,
  difficulty: String,
  topic: String,
  title: String,
  problemStatement: String,
  examples: [String],
  constraints: String,
  functionSignature: String,
  starterCode: String
});

const aiAssessmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'General'
  },
  questions: [questionSchema],
  difficulty: {
    type: String,
    default: 'Medium'
  },
  questionTypes: {
    type: [String],
    default: ['MCQ']
  },
  timeLimit: {
    type: String,
    default: 'No Limit'
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

const AIAssessment = mongoose.model('AIAssessment', aiAssessmentSchema);
export default AIAssessment;
