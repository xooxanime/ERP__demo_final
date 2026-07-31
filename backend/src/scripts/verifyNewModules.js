import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import AcademicSession from '../models/AcademicSession.js';
import FeeHead from '../models/FeeHead.js';
import FeeStructure from '../models/FeeStructure.js';
import StudentFeeLedger from '../models/StudentFeeLedger.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import SystemAuditLog from '../models/SystemAuditLog.js';
import { runInTransaction } from '../utils/transactionHelper.js';

dotenv.config();

const verifyNewModules = async () => {
  try {
    await connectDB();
    console.log('🧪 Starting validation and verification of new modules...\n');

    // Ensure all collections exist in database before starting transactions (prevents transaction catalog changes locks)
    console.log('📦 Pre-creating MongoDB collection structures...');
    await AcademicSession.createCollection();
    await FeeHead.createCollection();
    await FeeStructure.createCollection();
    await StudentFeeLedger.createCollection();
    await Payment.createCollection();
    await SystemAuditLog.createCollection();
    console.log('   All new collection models registered.');

    // 1. Check active academic session
    console.log('\n5. Testing Academic Session retrieval...');
    const activeSession = await AcademicSession.findOne({ isActive: true });
    if (!activeSession) {
      throw new Error('❌ Verification failed: No active AcademicSession found.');
    }
    console.log(`   [Active Session]: ${activeSession.name} (${activeSession._id})`);

    // 2. Fetch a dummy student and batch to simulate transactions
    const student = await User.findOne({ role: 'student' });
    const batch = await Batch.findOne({});

    if (!student || !batch) {
      console.warn('⚠️ Skipping detailed transaction verify: Seeding lacks users or batches.');
      console.log('✅ Basic models verified successfully.');
      process.exit(0);
    }

    // 3. Test Fee template and ledger mapping with transaction
    console.log('\n📌 Testing transaction-based fee structure & student ledger creation...');
    const feeHead = await FeeHead.findOne({});
    if (!feeHead) {
      throw new Error('❌ Verification failed: FeeHead must be seeded first.');
    }

    const testStructureId = await runInTransaction(async (session) => {
      // Create Structure template
      const [structure] = await FeeStructure.create([{
        title: 'TEST Verification Dues',
        academicSessionId: activeSession._id,
        batchId: batch._id,
        heads: [{ feeHeadId: feeHead._id, amount: 5000 }],
        totalAmount: 5000,
        dueDate: new Date('2026-12-31')
      }], { session });

      // Create student ledger item
      const [ledger] = await StudentFeeLedger.create([{
        studentId: student._id,
        feeStructureId: structure._id,
        academicSessionId: activeSession._id,
        items: [{
          feeHeadId: feeHead._id,
          baseAmount: 5000,
          discount: 0,
          fine: 0,
          finalAmount: 5000,
          isPaid: false
        }],
        totalBaseAmount: 5000,
        totalDiscount: 0,
        totalFine: 0,
        totalFinalAmount: 5000,
        amountPaid: 0,
        status: 'pending',
        dueDate: new Date('2026-12-31')
      }], { session });

      // Save System Audit Log
      await SystemAuditLog.create([{
        action: 'test_verify_creation',
        performedBy: student._id,
        academicSessionId: activeSession._id,
        targetType: 'FeeStructure',
        targetId: structure._id
      }], { session });

      return structure._id;
    });
    console.log(`   [Success]: Fee Structure created: ${testStructureId}`);

    // 4. Test Optimistic Concurrency Locking
    console.log('\n📌 Testing optimistic locking / version conflicts...');
    const ledger1 = await StudentFeeLedger.findOne({ feeStructureId: testStructureId });
    const ledger2 = await StudentFeeLedger.findOne({ feeStructureId: testStructureId });

    if (!ledger1 || !ledger2) {
      throw new Error('❌ Verification failed: Ledger documents not populated.');
    }

    // Update first instance
    ledger1.totalFine = 100;
    await ledger1.save();
    console.log('   Instance 1 updated fine to 100 successfully.');

    // Update second instance (should fail due to __v mismatch)
    ledger2.totalFine = 200;
    try {
      await ledger2.save();
      throw new Error('❌ Verification failed: Concurrency lock allowed concurrent write.');
    } catch (err) {
      if (err.name === 'VersionError') {
        console.log('   [Success]: Concurrency lock correctly caught VersionError on dirty write!');
      } else {
        throw err;
      }
    }

    // 5. Test Transaction Rollback
    console.log('\n📌 Testing transaction rollback on failure...');
    try {
      await runInTransaction(async (session) => {
        // Create duplicate payment (forcing duplicate key exception if utrNumber exists)
        await Payment.create([{
          studentId: student._id,
          academicSessionId: activeSession._id,
          transactionType: 'fee',
          referenceId: ledger1._id,
          amount: 5000,
          status: 'success',
          utrNumber: 'VERIFY-UTR-123'
        }], { session });

        // Simulate failing step
        throw new Error('Forced Verification Abort');
      });
    } catch (err) {
      if (err.message === 'Forced Verification Abort') {
        const checkPayment = await Payment.findOne({ utrNumber: 'VERIFY-UTR-123' });
        if (checkPayment) {
          throw new Error('❌ Verification failed: Transaction did not roll back payment creation.');
        } else {
          console.log('   [Success]: Transaction successfully rolled back all changes on failure!');
        }
      } else {
        throw err;
      }
    }

    // 6. Check audit log coverage
    console.log('\n📌 Checking System Audit Logs registration...');
    const auditRecord = await SystemAuditLog.findOne({ action: 'test_verify_creation' });
    if (!auditRecord) {
      throw new Error('❌ Verification failed: No SystemAuditLog entries created.');
    }
    console.log(`   [Success]: SystemAuditLog validated: Action "${auditRecord.action}" was tracked.`);

    // 7. Cleanup verification test records
    console.log('\n🧹 Cleaning up test verification records...');
    await FeeStructure.deleteOne({ _id: testStructureId });
    await StudentFeeLedger.deleteOne({ feeStructureId: testStructureId });
    await SystemAuditLog.deleteOne({ _id: auditRecord._id });
    console.log('   Cleanup done.');

    console.log('\n🎉 ALL VERIFICATIONS COMPLETED SUCCESSFULLY! SYSTEM HEALTHY. 🎉\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
};

verifyNewModules();
