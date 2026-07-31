import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'receipt'
  year: { type: Number, required: true },  // e.g., 2026
  seq: { type: Number, default: 0 }
});

counterSchema.index({ name: 1, year: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
