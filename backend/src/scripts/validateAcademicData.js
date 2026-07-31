import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Batch from '../models/Batch.js';
import Course from '../models/Course.js';

dotenv.config();

const validateAcademicData = async () => {
  try {
    await connectDB();
    console.log('🔍 Starting pre-migration database validation...\n');

    // 1. Validate Batches
    const batches = await Batch.find({});
    console.log(`📦 Checking ${batches.length} batches...`);
    let batchErrors = 0;
    batches.forEach(b => {
      if (!b.name || b.name.trim() === '') {
        console.error(`❌ Batch error: Batch ${b._id} has an empty or invalid name.`);
        batchErrors++;
      }
      if (!b.createdBy) {
        console.error(`❌ Batch error: Batch "${b.name}" (${b._id}) has no creator assigned.`);
        batchErrors++;
      }
    });

    // 2. Validate Courses
    const courses = await Course.find({});
    console.log(`📦 Checking ${courses.length} courses...`);
    let courseErrors = 0;
    courses.forEach(c => {
      if (!c.title || c.title.trim() === '') {
        console.error(`❌ Course error: Course ${c._id} has an empty or invalid title.`);
        courseErrors++;
      }
      if (c.price === undefined || c.price < 0) {
        console.error(`❌ Course error: Course "${c.title}" (${c._id}) has an invalid price: ${c.price}`);
        courseErrors++;
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Pre-Migration Validation Report:');
    console.log(`   Batch Errors  : ${batchErrors}`);
    console.log(`   Course Errors : ${courseErrors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (batchErrors + courseErrors === 0) {
      console.log('✅ Validation successful! Database is healthy and ready for migration.\n');
      process.exit(0);
    } else {
      console.error('❌ Validation failed! Please resolve the errors before migrating.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Pre-migration validation error:', error.message);
    process.exit(1);
  }
};

validateAcademicData();
