import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: ''
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },

  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  meetingLink: {
    type: String,
    required: true
  },

  startTime: {
    type: Date,
    required: true
  },

  endTime: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: [
      'scheduled',
      'live',
      'completed',
      'cancelled'
    ],
    default: 'scheduled'
  },

  recordingUrl: {
    type: String,
    default: ''
  },

  recordingPublicId: {
    type: String,
    default: ''
  },

  attendanceCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const LiveClass = mongoose.model(
  'LiveClass',
  liveClassSchema
);

export default LiveClass;