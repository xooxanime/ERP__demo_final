import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true, index: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  heads: [{
    feeHeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeHead', required: true },
    amount: { type: Number, required: true, min: 0 },
    isOptional: { type: Boolean, default: false }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date
}, { timestamps: true });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;
