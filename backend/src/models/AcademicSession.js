import mongoose from 'mongoose';

const academicSessionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true }, // e.g. '2026-27'
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['active', 'archived', 'upcoming'], default: 'upcoming', index: true }
}, { timestamps: true });

const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);
export default AcademicSession;
