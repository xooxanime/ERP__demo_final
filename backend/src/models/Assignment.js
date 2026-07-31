import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an assignment title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide an assignment description']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  attachments: [{
    title: String,
    url: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  }
}, {
  timestamps: true
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
