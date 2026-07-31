import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { 
    type: String, 
    required: true,
    enum: ['quiz', 'assignment', 'CT1', 'CT2', 'unit_test', 'midterm', 'half_yearly', 'final_exam', 'practical', 'lab', 'oral', 'viva'] 
  },
  deliveryMode: { type: String, enum: ['online', 'offline'], default: 'online', index: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  dueDate: { type: Date, required: true },
  duration: { type: Number, default: 30 }, // in minutes for online attempts
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  negativeMarking: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: true, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date
}, { 
  timestamps: true,
  optimisticConcurrency: true
});

// Compound index for quick assessment dashboard lists
assessmentSchema.index({ batchId: 1, academicSessionId: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
