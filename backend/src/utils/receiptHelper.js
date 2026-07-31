import Counter from '../models/Counter.js';

/**
 * Returns an atomically incremented sequential receipt number for billing audits.
 * Format: REC-YYYY-XXXXXX (e.g. REC-2026-000001)
 * @param {Object} session - Mongoose session transaction object.
 */
export const getNextReceiptNumber = async (session) => {
  const currentYear = new Date().getFullYear();
  
  const counter = await Counter.findOneAndUpdate(
    { name: 'receipt', year: currentYear },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );

  const paddedSeq = String(counter.seq).padStart(6, '0');
  return `REC-${currentYear}-${paddedSeq}`;
};
