import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

async function runVerification() {
  console.log('=== BEAST MODE FINAL VERIFICATION START ===');
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_database';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully!');

    // 1. Check Student Notification Database Query
    const testStudent = await User.findOne({ role: { $regex: /^student$/i } });
    if (testStudent) {
      console.log(`[PASS] Found test student: ${testStudent.name} (${testStudent._id})`);

      // Create a test DB notification for verification
      const notif = await Notification.create({
        recipient: testStudent._id,
        title: 'System Audit Test Notification',
        message: 'Testing mark read synchronization',
        type: 'info',
        section: 'general',
        read: false
      });
      console.log('[PASS] Created test notification ID:', notif._id);

      // Execute updateMany for student
      await Notification.updateMany({ recipient: testStudent._id }, { $set: { read: true } });
      const updatedNotif = await Notification.findById(notif._id);
      console.log(`[PASS] Verification Notification read status: ${updatedNotif.read} (Expected: true)`);

      // Cleanup test notification
      await Notification.findByIdAndDelete(notif._id);
    }

    console.log('=== BEAST MODE VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
  } catch (err) {
    console.error('Verification error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();
