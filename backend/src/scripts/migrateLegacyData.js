import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import AcademicSession from '../models/AcademicSession.js';
import FeeHead from '../models/FeeHead.js';
import Batch from '../models/Batch.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';

dotenv.config();

const migrateLegacyData = async () => {
  try {
    await connectDB();
    console.log('🚀 Starting legacy database migration...\n');

    // 1. Seed AcademicSession
    console.log('🌱 Seeding default Academic Session "2026-27"...');
    let session = await AcademicSession.findOne({ name: '2026-27' });
    if (!session) {
      session = await AcademicSession.create({
        name: '2026-27',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isActive: true,
        status: 'active'
      });
      console.log('✅ Academic Session "2026-27" created successfully.');
    } else {
      console.log('ℹ️  Academic Session "2026-27" already exists.');
    }

    // 2. Seed default FeeHeads
    console.log('\n🌱 Seeding default Fee Heads...');
    const defaultHeads = [
      { name: 'Tuition Fee', description: 'Academic tuition charges' },
      { name: 'Admission Fee', description: 'New admission enrollment charges' },
      { name: 'Library Fee', description: 'Library card and maintenance charges' },
      { name: 'Transport Fee', description: 'Optional school bus transport charges' },
      { name: 'Lab Fee', description: 'Practical lab and equipment charges' },
      { name: 'Sports Fee', description: 'Sports equipment and complex charges' },
      { name: 'Exam Fee', description: 'Term-end exam processing charges' },
      { name: 'Hostel Fee', description: 'Residential boarding charges' },
      { name: 'Uniform Fee', description: 'School uniform set charges' },
      { name: 'Miscellaneous Fee', description: 'General extra-curricular charges' }
    ];

    for (const head of defaultHeads) {
      const existing = await FeeHead.findOne({ name: head.name });
      if (!existing) {
        await FeeHead.create(head);
        console.log(`   + Added Fee Head: ${head.name}`);
      } else {
        console.log(`   ℹ️  Fee Head "${head.name}" already exists.`);
      }
    }

    const sessionId = session._id;

    // 3. Update existing Batches to refer to academicSessionId
    console.log('\n📦 Upgrading Batch documents...');
    const batchUpdateResult = await Batch.updateMany(
      { academicSessionId: { $exists: false } },
      { $set: { academicSessionId: sessionId } }
    );
    console.log(`✅ Batches updated: ${batchUpdateResult.modifiedCount || 0} modified.`);

    // 4. Update existing Courses to refer to academicSessionId
    console.log('📦 Upgrading Course documents...');
    const courseUpdateResult = await Course.updateMany(
      { academicSessionId: { $exists: false } },
      { $set: { academicSessionId: sessionId } }
    );
    console.log(`✅ Courses updated: ${courseUpdateResult.modifiedCount || 0} modified.`);

    // 5. Update existing Attendances to refer to academicSessionId
    console.log('📦 Upgrading Attendance documents...');
    const attendanceUpdateResult = await Attendance.updateMany(
      { academicSessionId: { $exists: false } },
      { $set: { academicSessionId: sessionId } }
    );
    console.log(`✅ Attendances updated: ${attendanceUpdateResult.modifiedCount || 0} modified.`);

    // 6. Update existing Payments to refer to academicSessionId
    console.log('📦 Upgrading Payment documents...');
    const paymentUpdateResult = await Payment.updateMany(
      { academicSessionId: { $exists: false } },
      { $set: { academicSessionId: sessionId } }
    );
    console.log(`✅ Payments updated: ${paymentUpdateResult.modifiedCount || 0} modified.`);

    console.log('\n🎉 Migration complete! All legacy data is now linked to Academic Session "2026-27".\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateLegacyData();
