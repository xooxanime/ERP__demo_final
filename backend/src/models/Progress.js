import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  totalVideos: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  quizScores: [{
    quiz: String,
    score: Number,
    totalQuestions: Number,
    date: Date
  }],
  assignments: [{
    title: String,
    submitted: Boolean,
    score: Number,
    submittedDate: Date,
    dueDate: Date
  }]
}, {
  timestamps: true
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
