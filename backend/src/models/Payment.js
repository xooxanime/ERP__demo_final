import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course' // Optional now for generic payment engine
  },
  transactionType: {
    type: String,
    enum: ['fee', 'admission', 'hostel', 'transport', 'certificate', 'fine'],
    default: 'fee',
    index: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Can point to StudentFeeLedger, etc.
    index: true
  },
  utrNumber: {
    type: String,
    sparse: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['manual_utr', 'razorpay'],
    default: 'manual_utr',
    index: true
  },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true, unique: true, sparse: true },
  razorpaySignature: { type: String },
  paymentDate: { type: Date, index: true }
}, {
  timestamps: true
});

// Compound Index for fast payment histories per year
paymentSchema.index({ studentId: 1, academicSessionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
