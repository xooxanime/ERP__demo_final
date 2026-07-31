import mongoose from 'mongoose';

const studentFeeLedgerSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure', required: true, index: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true, index: true },
  items: [{
    feeHeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeHead', required: true },
    baseAmount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    fine: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    isPaid: { type: Boolean, default: false }
  }],
  totalBaseAmount: { type: Number, required: true, min: 0 },
  totalDiscount: { type: Number, default: 0, min: 0 },
  totalFine: { type: Number, default: 0, min: 0 },
  totalFinalAmount: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'partially_paid', 'paid', 'overdue'], default: 'pending', index: true },
  dueDate: { type: Date, required: true, index: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date
}, { 
  timestamps: true,
  optimisticConcurrency: true // Enable optimistic locking
});

// Compound Indexes for fast student billing queries
studentFeeLedgerSchema.index({ studentId: 1, academicSessionId: 1 });
studentFeeLedgerSchema.index({ feeStructureId: 1, studentId: 1 });

const StudentFeeLedger = mongoose.model('StudentFeeLedger', studentFeeLedgerSchema);
export default StudentFeeLedger;
