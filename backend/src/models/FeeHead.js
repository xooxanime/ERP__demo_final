import mongoose from 'mongoose';

const feeHeadSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, index: true }, // e.g., 'Tuition Fee', 'Transport Fee'
  description: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date
}, { timestamps: true });

const FeeHead = mongoose.model('FeeHead', feeHeadSchema);
export default FeeHead;
