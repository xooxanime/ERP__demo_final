import mongoose from 'mongoose';

/**
 * Runs a function within a MongoDB session transaction.
 * Falls back to running without a transaction if replica sets are not supported in dev/local environments.
 */
export const runInTransaction = async (fn) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};
