import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Batch from '../models/Batch.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';

dotenv.config();

const rollbackLegacyData = async () => {
  try {
    await connectDB();
    console.log('🔄 Starting pre-rollback checks and database migration cleanup...\n');

    // 1. Remove academicSessionId references from Batches
    console.log('🧹 Rolling back Batch documents...');
    const batchRollbackResult = await Batch.updateMany(
      {},
      { $unset: { academicSessionId: "" } }
    );
    console.log(`✅ Batches rolled back: ${batchRollbackResult.modifiedCount || 0} modified.`);

    // 2. Remove academicSessionId references from Courses
    console.log('🧹 Rolling back Course documents...');
    const courseRollbackResult = await Course.updateMany(
      {},
      { $unset: { academicSessionId: "" } }
    );
    console.log(`✅ Courses rolled back: ${courseRollbackResult.modifiedCount || 0} modified.`);

    // 3. Remove academicSessionId references from Attendances
    console.log('🧹 Rolling back Attendance documents...');
    const attendanceRollbackResult = await Attendance.updateMany(
      {},
      { $unset: { academicSessionId: "" } }
    );
    console.log(`✅ Attendances rolled back: ${attendanceRollbackResult.modifiedCount || 0} modified.`);

    // 4. Remove academicSessionId references from Payments
    console.log('🧹 Rolling back Payment documents...');
    const paymentRollbackResult = await Payment.updateMany(
      {},
      { $unset: { academicSessionId: "" } }
    );
    console.log(`✅ Payments rolled back: ${paymentRollbackResult.modifiedCount || 0} modified.`);

    // 5. Drop new collections
    const collectionsToDrop = [
      'academicsessions',
      'feeheads',
      'feestructures',
      'studentfeeledgers',
      'assessments',
      'assessmentquestions',
      'assessmentattempts',
      'examscores',
      'counters',
      'systemauditlogs'
    ];

    console.log('\n🧹 Dropping newly created collections...');
    const db = mongoose.connection.db;
    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

    for (const colName of collectionsToDrop) {
      if (existingCollections.includes(colName)) {
        await db.collection(colName).drop();
        console.log(`   - Dropped Collection: ${colName}`);
      } else {
        console.log(`   - Collection "${colName}" does not exist, skipping.`);
      }
    }

    console.log('\n🎉 Rollback complete! Legacies are restored and new schemas have been dropped.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
};

rollbackLegacyData();
