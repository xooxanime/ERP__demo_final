import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a batch name'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    index: true
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  batchManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  canManageStudents: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index for batch name within the same academic session
batchSchema.index({ name: 1, academicSessionId: 1 }, { unique: true });

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
