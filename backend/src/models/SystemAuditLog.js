import mongoose from 'mongoose';

const systemAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', index: true },
  targetType: { type: String, required: true, index: true }, // e.g. 'Fee', 'ExamScore', 'Payment'
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  oldValues: { type: mongoose.Schema.Types.Mixed },
  newValues: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, immutable: true }
});

const SystemAuditLog = mongoose.model('SystemAuditLog', systemAuditLogSchema);
export default SystemAuditLog;
