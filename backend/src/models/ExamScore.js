import mongoose from 'mongoose';

const examScoreSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true, index: true },
  marksObtained: { type: Number, required: true, min: 0 },
  graceMarks: { type: Number, default: 0, min: 0 },
  moderatedMarks: { type: Number, default: 0, min: 0 },
  finalScore: { type: Number, required: true, min: 0 }, // finalScore = marksObtained + graceMarks + moderatedMarks (capped at Assessment.totalMarks)
  percentage: { type: Number, required: true, min: 0, max: 100 },
  grade: { type: String, required: true }, // CBSE grade e.g., 'A1', 'A2', 'B1'
  gradePoint: { type: Number, default: 0, min: 0, max: 10 }, // For GPA/CGPA conversions
  passStatus: { type: String, enum: ['pass', 'fail'], required: true, index: true },
  remarks: { type: String, default: '' },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gradedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  optimisticConcurrency: true // Prevent concurrent marks modifications
});

// Compound Indexes for fast results query
examScoreSchema.index({ studentId: 1, academicSessionId: 1 });
examScoreSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

const ExamScore = mongoose.model('ExamScore', examScoreSchema);
export default ExamScore;
