import Payment from '../models/Payment.js';
import StudentFeeLedger from '../models/StudentFeeLedger.js';
import User from '../models/User.js';
import AcademicSession from '../models/AcademicSession.js';
import SystemAuditLog from '../models/SystemAuditLog.js';
import { fetchPaymentsForOrder } from './razorpayService.js';
import { acquireLock, releaseLock } from '../utils/redisLock.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { getNextReceiptNumber } from '../utils/receiptHelper.js';
import notificationService from './notificationService.js';

// Metrics gauge counter for unresolved payments
let unresolvedPaymentsGauge = 0;

const auditLog = async (action, performedBy, targetId, oldValues, newValues, session) => {
  try {
    const currentSession = await AcademicSession.findOne({ isActive: true });
    await SystemAuditLog.create([{
      action,
      performedBy,
      academicSessionId: currentSession?._id,
      targetType: 'Payment',
      targetId,
      oldValues,
      newValues,
      ipAddress: '127.0.0.1',
      userAgent: 'ReconciliationService-Daemon'
    }], { session });
  } catch (err) {
    console.error('⚠️ [Reconciliation] Failed to log system audit:', err.message);
  }
};

/**
 * Runs a cycle to reconcile pending Razorpay payments directly against Razorpay API orders history.
 */
export const runReconciliationCycle = async () => {
  console.log('🔄 [Reconciliation Service] Starting payment reconciliation check...');
  
  try {
    // Reconcile payments created older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const pendingPayments = await Payment.find({
      status: 'pending',
      paymentMethod: 'razorpay',
      createdAt: { $lt: fiveMinutesAgo }
    });

    console.log(`ℹ️ [Reconciliation Service] Found ${pendingPayments.length} pending Razorpay payments for check.`);
    
    let resolvedCount = 0;
    let failedCount = 0;
    unresolvedPaymentsGauge = 0;

    for (const payment of pendingPayments) {
      if (!payment.razorpayOrderId) {
        console.warn(`   - Payment record ${payment._id} has no razorpayOrderId, skipping.`);
        continue;
      }

      try {
        console.log(`   - Querying Razorpay transactions for Order ID: ${payment.razorpayOrderId}...`);
        const rzpResponse = await fetchPaymentsForOrder(payment.razorpayOrderId);
        
        const paymentsList = rzpResponse?.items || [];
        
        // Find captured transaction if any
        const capturedTx = paymentsList.find(p => p.status === 'captured');
        // Find if all attempted transactions failed
        const allFailed = paymentsList.length > 0 && paymentsList.every(p => p.status === 'failed');

        if (capturedTx) {
          const rzpPaymentId = capturedTx.id;
          const lockKey = `lock_verify_${payment.razorpayOrderId}_${rzpPaymentId}`;
          const ownerToken = `reconcile_${Math.random().toString(36).substring(2, 10)}`;
          
          // Acquire Lock
          const lockAcquired = await acquireLock(lockKey, 300, ownerToken);
          if (!lockAcquired) {
            console.log(`     ⏭️ Lock active for payment verify, skipping duplicate run.`);
            continue;
          }

          try {
            await runInTransaction(async (session) => {
              // Re-fetch payment inside session
              const freshPayment = await Payment.findById(payment._id).session(session);
              if (!freshPayment || freshPayment.status !== 'pending') return;

              const ledger = await StudentFeeLedger.findById(payment.referenceId).session(session);
              if (!ledger) {
                throw new Error(`Ledger record ${payment.referenceId} not found`);
              }

              const receiptNumber = await getNextReceiptNumber(session);

              // Update Payment
              freshPayment.status = 'success';
              freshPayment.razorpayPaymentId = rzpPaymentId;
              freshPayment.utrNumber = receiptNumber;
              freshPayment.paymentDate = Date.now();
              await freshPayment.save({ session });

              // Update Ledger
              ledger.amountPaid += freshPayment.amount;
              ledger.status = ledger.amountPaid >= ledger.totalFinalAmount ? 'paid' : 'partially_paid';
              ledger.paymentId = freshPayment._id;
              ledger.items = ledger.items.map(item => ({ ...item, isPaid: true }));
              await ledger.save({ session });

              // Audit log
              await auditLog('reconciliation_payment_settled', payment.studentId, freshPayment._id, null, freshPayment.toObject(), session);

              resolvedCount++;
              console.log(`     ✅ [Reconciled]: Settled payment ${freshPayment._id} | Receipt: ${receiptNumber}`);
            });

            // Dispatch notification in background
            setImmediate(async () => {
              try {
                const student = await User.findById(payment.studentId);
                const ledger = await StudentFeeLedger.findById(payment.referenceId);
                await notificationService.notify(student, 'payment_success', {
                  amount: payment.amount,
                  courseName: ledger?.title || 'Batch Tuition Fee',
                  receiptId: payment.utrNumber
                });
              } catch (err) {
                console.error('     ⚠️ [Reconciliation] Notification error:', err.message);
              }
            });

          } finally {
            await releaseLock(lockKey, ownerToken);
          }

        } else if (allFailed) {
          // If all payments failed, mark our record as failed
          payment.status = 'failed';
          await payment.save();
          failedCount++;
          console.log(`     ❌ [Reconciled]: Payment ${payment._id} marked as FAILED.`);
        } else {
          // Unresolved payments (either no checkouts attempted or still in process)
          unresolvedPaymentsGauge++;
        }

      } catch (err) {
        console.error(`   - Failed to reconcile payment ${payment._id}:`, err.message);
        unresolvedPaymentsGauge++;
      }
    }

    console.log(`📊 [Reconciliation Service] Run complete: Resolves: ${resolvedCount} | Failures: ${failedCount} | Unresolved remaining: ${unresolvedPaymentsGauge}\n`);

  } catch (error) {
    console.error('❌ [Reconciliation Service] Critical checkup cycle exception:', error.message);
  }
};

/**
 * Initializes the background reconciliation interval timer daemon.
 * @param {Number} intervalMinutes - Interval frequency in minutes.
 */
export const startReconciliationService = (intervalMinutes = 15) => {
  console.log(`🏁 [Reconciliation Service] Starting background checkups daemon (Interval: every ${intervalMinutes} minutes)...`);
  setInterval(async () => {
    await runReconciliationCycle();
  }, intervalMinutes * 60 * 1000);
};

export const getReconciliationMetrics = () => ({
  unresolvedPaymentsCount: unresolvedPaymentsGauge
});
