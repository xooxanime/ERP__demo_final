import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: String,
  duration: String,
  order: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  }
});

const moduleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a module title']
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  videos: [videoSchema],
  notes: [{
    title: String,
    url: String,
    publicId: String
  }],
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Module = mongoose.model('Module', moduleSchema);

export default Module;
