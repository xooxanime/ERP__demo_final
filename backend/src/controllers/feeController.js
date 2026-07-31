import mongoose from 'mongoose';
import FeeHead from '../models/FeeHead.js';
import FeeStructure from '../models/FeeStructure.js';
import StudentFeeLedger from '../models/StudentFeeLedger.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import AcademicSession from '../models/AcademicSession.js';
import SystemAuditLog from '../models/SystemAuditLog.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { createRazorpayOrder, verifyRazorpaySignature, isMockMode, fetchRazorpayPayment, verifyWebhookSignature } from '../services/razorpayService.js';
import { getNextReceiptNumber } from '../utils/receiptHelper.js';
import { generateReceiptPDF } from '../utils/receiptGenerator.js';
import notificationService from '../services/notificationService.js';
import { acquireLock, releaseLock } from '../utils/redisLock.js';
import { resolveChildIdForUser } from './parentController.js';

// Helper to audit events
const auditLog = async (action, req, targetType, targetId, oldValues, newValues, session) => {
  try {
    const currentSession = await AcademicSession.findOne({ isActive: true });
    await SystemAuditLog.create([{
      action,
      performedBy: req.user.id,
      academicSessionId: currentSession?._id,
      targetType,
      targetId,
      oldValues,
      newValues,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown'
    }], { session });
  } catch (err) {
    console.error('⚠️ Failed to save system audit log:', err.message);
  }
};

// ==========================================
// FEE HEADS (Admin)
// ==========================================

export const createFeeHead = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Name is required' });
    }

    const head = await FeeHead.create({ name, description });
    await auditLog('fee_head_created', req, 'FeeHead', head._id, null, head.toObject());

    res.status(201).json({ status: 'success', data: { feeHead: head } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getFeeHeads = async (req, res) => {
  try {
    const heads = await FeeHead.find({ isDeleted: false });
    res.status(200).json({ status: 'success', results: heads.length, data: { feeHeads: heads } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getActiveSession = async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ isActive: true });
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'No active academic session found' });
    }
    res.status(200).json({ status: 'success', data: { academicSession: session } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// FEE STRUCTURES & AUTO-ALLOCATIONS (Admin)
// ==========================================

export const createFeeStructure = async (req, res) => {
  try {
    const { title, academicSessionId, batchId, heads, dueDate } = req.body;

    if (!title || !academicSessionId || !batchId || !heads || heads.length === 0 || !dueDate) {
      return res.status(400).json({ status: 'error', message: 'Please provide all required structure fields' });
    }

    // Strict validation: academicSessionId must be a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(academicSessionId)) {
      return res.status(400).json({ status: 'error', message: 'academicSessionId must be a valid 24-character hexadecimal ObjectId' });
    }

    // Verify batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ status: 'error', message: 'Batch not found' });
    }

    // Run in atomic transaction
    const result = await runInTransaction(async (session) => {
      // Calculate total amount
      const totalAmount = heads.reduce((sum, h) => sum + (h.amount || 0), 0);

      // 1. Create Structure Template
      const [structure] = await FeeStructure.create([{
        title,
        academicSessionId,
        batchId,
        heads,
        totalAmount,
        dueDate
      }], { session });

      // 2. Perform bulkWrite() ledgers for all students in the batch
      if (batch.students && batch.students.length > 0) {
        const ledgerItems = heads.map(h => ({
          feeHeadId: h.feeHeadId,
          baseAmount: h.amount,
          discount: 0,
          fine: 0,
          finalAmount: h.amount,
          isPaid: false
        }));

        const bulkOps = batch.students.map(studentId => ({
          insertOne: {
            document: {
              studentId,
              feeStructureId: structure._id,
              academicSessionId,
              items: ledgerItems,
              totalBaseAmount: totalAmount,
              totalDiscount: 0,
              totalFine: 0,
              totalFinalAmount: totalAmount,
              amountPaid: 0,
              status: 'pending',
              dueDate
            }
          }
        }));

        await StudentFeeLedger.bulkWrite(bulkOps, { session });
      }

      await auditLog('fee_structure_created_and_allocated', req, 'FeeStructure', structure._id, null, structure.toObject(), session);

      return structure;
    });

    res.status(201).json({
      status: 'success',
      message: 'Fee structure created and allocated to batch successfully!',
      data: { feeStructure: result }
    });

    // Notify students asynchronously
    setImmediate(async () => {
      try {
        const studentLedgers = await StudentFeeLedger.find({ feeStructureId: result._id }).populate('studentId');
        for (const ledger of studentLedgers) {
          if (ledger.studentId && ledger.studentId.role === 'student') {
            await notificationService.notify(ledger.studentId, 'fee_reminder', {
              amount: ledger.totalFinalAmount,
              dueDate: new Date(ledger.dueDate).toLocaleDateString()
            });
          }
        }
      } catch (err) {
        console.error('Background fee generation notifications error:', err.message);
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getFeeStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find({ isDeleted: false })
      .populate('batchId', 'name')
      .populate('academicSessionId', 'name')
      .populate('heads.feeHeadId', 'name');

    res.status(200).json({ status: 'success', data: { feeStructures: structures } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Soft delete structure
export const deleteFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findById(req.params.id);
    if (!structure || structure.isDeleted) {
      return res.status(404).json({ status: 'error', message: 'Fee structure not found' });
    }

    await runInTransaction(async (session) => {
      structure.isDeleted = true;
      structure.deletedAt = Date.now();
      await structure.save({ session });

      // Soft delete allocated ledgers as well
      await StudentFeeLedger.updateMany(
        { feeStructureId: structure._id },
        { $set: { isDeleted: true, deletedAt: Date.now() } },
        { session }
      );

      await auditLog('fee_structure_deleted', req, 'FeeStructure', structure._id, { id: structure._id }, { isDeleted: true }, session);
    });

    res.status(200).json({ status: 'success', message: 'Fee structure deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// STUDENT FEE LEDGERS (Admin / Student / Parent)
// ==========================================

export const getStudentFeeLedgers = async (req, res) => {
  try {
    const { studentId, academicSessionId } = req.query;
    let targetStudentId = studentId;

    if (req.user.role === 'student') {
      targetStudentId = req.user.id;
    } else if (req.user.role === 'parent') {
      const childId = await resolveChildIdForUser(req.user);
      if (!childId) {
        return res.status(404).json({ status: 'error', message: 'No linked student found for parent profile.' });
      }
      const childIdStr = childId.toString();
      if (studentId && studentId.toString() !== childIdStr) {
        return res.status(403).json({ status: 'error', message: 'Access Denied: Not authorized to view billing details for this student profile.' });
      }
      targetStudentId = childId;
    }

    const query = { isDeleted: false };
    if (targetStudentId) query.studentId = targetStudentId;
    if (academicSessionId) query.academicSessionId = academicSessionId;

    const ledgers = await StudentFeeLedger.find(query)
      .populate('studentId', 'name email phone role')
      .populate('feeStructureId', 'title')
      .populate('academicSessionId', 'name')
      .populate('items.feeHeadId', 'name')
      .sort({ dueDate: 1 });

    res.status(200).json({ status: 'success', results: ledgers.length, data: { ledgers } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Custom individual overrides (Admin)
export const adjustLedgerItem = async (req, res) => {
  try {
    const { ledgerId } = req.params;
    const { headNameOrId, discount, fine } = req.body; // adjust values for a single head item

    const ledger = await StudentFeeLedger.findById(ledgerId);
    if (!ledger || ledger.isDeleted) {
      return res.status(404).json({ status: 'error', message: 'Ledger record not found' });
    }

    const oldLedgerSnapshot = ledger.toObject();

    // Verify concurrency version match if provided
    if (req.body.__v !== undefined && ledger.__v !== req.body.__v) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'Conflict: This record has been updated by another session. Please refresh and try again.' 
      });
    }

    // Find the item to adjust
    const item = ledger.items.find(i => 
      i.feeHeadId.toString() === headNameOrId || i._id.toString() === headNameOrId
    );

    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Item not found in ledger' });
    }

    if (discount !== undefined) item.discount = discount;
    if (fine !== undefined) item.fine = fine;

    // Recalculate final item amount
    item.finalAmount = item.baseAmount - item.discount + item.fine;

    // Recalculate ledger totals
    ledger.totalDiscount = ledger.items.reduce((sum, i) => sum + i.discount, 0);
    ledger.totalFine = ledger.items.reduce((sum, i) => sum + i.fine, 0);
    ledger.totalFinalAmount = ledger.items.reduce((sum, i) => sum + i.finalAmount, 0);

    // Save with optimistic locking check
    await ledger.save();

    await auditLog('ledger_item_adjusted', req, 'StudentFeeLedger', ledger._id, oldLedgerSnapshot, ledger.toObject());

    res.status(200).json({ status: 'success', message: 'Ledger item adjusted successfully', data: { ledger } });
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({
        status: 'error',
        message: 'Conflict: Record changed while updating. Try again.'
      });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// PAYMENT ENGINE & CHECKOUT FLOW (Student)
// ==========================================

export const createPaymentOrder = async (req, res) => {
  try {
    const { ledgerId } = req.body;

    const ledger = await StudentFeeLedger.findById(ledgerId);
    if (!ledger || ledger.isDeleted) {
      return res.status(404).json({ status: 'error', message: 'Invoice ledger not found' });
    }

    if (ledger.status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'This invoice has already been fully paid' });
    }

    // Enforce scoping
    if (req.user.role === 'student' && ledger.studentId.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Access denied: Cannot pay another student dues' });
    }

    if (req.user.role === 'parent') {
      const childId = await resolveChildIdForUser(req.user);
      const childIdStr = childId ? childId.toString() : '';
      const ledgerStudentIdStr = ledger.studentId?._id ? ledger.studentId._id.toString() : ledger.studentId.toString();

      if (!childIdStr || childIdStr !== ledgerStudentIdStr) {
        return res.status(403).json({ status: 'error', message: 'Access denied: Cannot pay dues for this student' });
      }
    }

    // Dues remaining
    const outstandingDues = ledger.totalFinalAmount - ledger.amountPaid;

    // Initiate Order
    const order = await createRazorpayOrder(outstandingDues, ledgerId);

    // Create a pending Payment transaction record
    const payment = await Payment.create({
      studentId: ledger.studentId,
      academicSessionId: ledger.academicSessionId,
      transactionType: 'fee',
      referenceId: ledger._id,
      amount: outstandingDues,
      status: 'pending',
      paymentMethod: 'razorpay',
      razorpayOrderId: order.id
    });

    res.status(200).json({
      status: 'success',
      isMock: order.isMock,
      orderId: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_5H0X0000000000',
      paymentId: payment._id
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, ledgerId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId) {
    return res.status(400).json({ status: 'error', message: 'Missing payment details' });
  }

  const lockKey = `lock_verify_${razorpayOrderId}_${razorpayPaymentId}`;
  const ownerToken = `verify_${Math.random().toString(36).substring(2, 10)}`;

  // 1. Acquire Distributed Lock (10 mins TTL)
  const lockAcquired = await acquireLock(lockKey, 600, ownerToken);
  if (!lockAcquired) {
    return res.status(200).json({ status: 'success', message: 'Payment already processed or lock active (idempotent block)' });
  }

  try {
    // 2. Signature verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      await releaseLock(lockKey, ownerToken);
      return res.status(400).json({ status: 'error', message: 'Payment verification failed: Invalid signature' });
    }

    // 3. Update records inside database transaction
    const result = await runInTransaction(async (session) => {
      const payment = await Payment.findOne({ razorpayOrderId }).session(session);
      if (!payment) {
        throw new Error('Associated transaction record not found');
      }

      if (payment.status === 'success') {
        return { payment, duplicate: true };
      }

      const ledger = await StudentFeeLedger.findById(ledgerId).session(session);
      if (!ledger) {
        throw new Error('Ledger record not found');
      }

      // Check version concurrency match
      if (req.body.__v !== undefined && ledger.__v !== req.body.__v) {
        throw new Error('Conflict: Record changed during checkout. Retrying transaction.');
      }

      const receiptNumber = await getNextReceiptNumber(session);

      // Update payment
      payment.status = 'success';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.utrNumber = receiptNumber; // Use receipt sequence number as printable UTR ref
      payment.paymentDate = Date.now();
      await payment.save({ session });

      // Update Student Dues
      ledger.amountPaid = Math.min(ledger.totalFinalAmount, ledger.amountPaid + payment.amount);
      ledger.status = ledger.amountPaid >= ledger.totalFinalAmount ? 'paid' : 'partially_paid';
      ledger.paymentId = payment._id;
      ledger.items = ledger.items.map(item => ({
        ...item,
        isPaid: true // Mark heads paid
      }));
      await ledger.save({ session });

      await auditLog('payment_verified_and_processed', req, 'Payment', payment._id, null, payment.toObject(), session);

      return { payment, ledger, duplicate: false };
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified and receipt created successfully!',
      data: { payment: result.payment }
    });

    // Send notifications background
    if (!result.duplicate) {
      setImmediate(async () => {
        try {
          const student = await User.findById(result.payment.studentId);
          await notificationService.notify(student, 'payment_success', {
            amount: result.payment.amount,
            courseName: result.ledger?.title || 'Batch Tuition Fee',
            receiptId: result.payment.utrNumber
          });
        } catch (err) {
          console.error('Background payment confirmation notifications failed:', err.message);
        }
      });
    }

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    // Release Lock
    await releaseLock(lockKey, ownerToken);
  }
};

// ==========================================
// RECEIPT PDF EXPORT (Public / Auth check)
// ==========================================

export const downloadReceiptPDF = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== 'success') {
      return res.status(404).json({ status: 'error', message: 'Completed payment record not found' });
    }

    // Strict ownership check (Admin, matching Student, or parent of matching Student)
    if (req.user.role !== 'admin') {
      if (req.user.role === 'student' && payment.studentId.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'Access Denied: You can only download your own receipts.' });
      }
      if (req.user.role === 'parent') {
        const childId = await resolveChildIdForUser(req.user);
        const childIdStr = childId ? childId.toString() : '';
        const paymentStudentIdStr = payment.studentId?._id ? payment.studentId._id.toString() : payment.studentId.toString();
        
        if (!childIdStr || childIdStr !== paymentStudentIdStr) {
          return res.status(403).json({ status: 'error', message: 'Access Denied: You are not authorized to download receipts for this student profile.' });
        }
      }
    }

    const ledger = await StudentFeeLedger.findById(payment.referenceId)
      .populate('items.feeHeadId', 'name');
    
    const student = await User.findById(payment.studentId);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student associated with this payment not found' });
    }
    
    // Parent info link query
    const parent = await User.findOne({
      role: 'parent',
      'parentInfo.studentId': student._id
    });

    const session = await AcademicSession.findById(payment.academicSessionId || ledger?.academicSessionId);

    // Dynamic filename
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Receipt_${payment.utrNumber || payment._id}.pdf"`);

    // Generate and pipe PDF directly to response stream
    generateReceiptPDF(payment, ledger, student, parent, session, null, res);

    await auditLog('receipt_pdf_downloaded', req, 'Payment', payment._id, null, { downloaded: true });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// RAZORPAY WEBHOOKS LISTENER (Asynchronous)
// ==========================================

export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // 1. Verify webhook signature if secret key is present in env variables
  if (webhookSecret && signature) {
    const isWebhookValid = verifyWebhookSignature(req.rawBody, signature, webhookSecret);
    if (!isWebhookValid) {
      return res.status(400).json({ status: 'error', message: 'Invalid webhook signature' });
    }
  }

  const { event, payload } = req.body;

  // We only care about payments captured
  if (event !== 'payment.captured' || !payload || !payload.payment || !payload.payment.entity) {
    return res.status(200).json({ status: 'ignored', message: 'Not a payment capture event' });
  }

  const rzpPayment = payload.payment.entity;
  const razorpayOrderId = rzpPayment.order_id;
  const razorpayPaymentId = rzpPayment.id;

  const lockKey = `lock_verify_${razorpayOrderId}_${razorpayPaymentId}`;
  const ownerToken = `webhook_${Math.random().toString(36).substring(2, 10)}`;
  const lockAcquired = await acquireLock(lockKey, 600, ownerToken);
  if (!lockAcquired) {
    return res.status(200).json({ status: 'ignored', message: 'Payment currently being processed elsewhere' });
  }

  try {
    // 1. Double check payment status directly from Razorpay to avoid spoofing
    const verifiedDetails = await fetchRazorpayPayment(razorpayPaymentId);
    if (!verifiedDetails || verifiedDetails.status !== 'captured' || verifiedDetails.order_id !== razorpayOrderId) {
      await releaseLock(lockKey, ownerToken);
      return res.status(400).json({ status: 'error', message: 'Webhook validation failed: Status mismatch' });
    }

    // 2. Perform database updates in a transaction
    const result = await runInTransaction(async (session) => {
      const payment = await Payment.findOne({ razorpayOrderId }).session(session);
      if (!payment) {
        throw new Error('Associated payment not found');
      }

      if (payment.status === 'success') {
        return { payment, duplicate: true };
      }

      const ledger = await StudentFeeLedger.findById(payment.referenceId).session(session);
      if (!ledger) {
        throw new Error('Associated student fee ledger not found');
      }

      const receiptNumber = await getNextReceiptNumber(session);

      payment.status = 'success';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.utrNumber = receiptNumber;
      payment.paymentDate = Date.now();
      await payment.save({ session });

      ledger.amountPaid = Math.min(ledger.totalFinalAmount, ledger.amountPaid + payment.amount);
      ledger.status = ledger.amountPaid >= ledger.totalFinalAmount ? 'paid' : 'partially_paid';
      ledger.paymentId = payment._id;
      ledger.items = ledger.items.map(item => ({ ...item, isPaid: true }));
      await ledger.save({ session });

      // In webhook context, req doesn't have a user since it's anonymous Razorpay request.
      // So we pass simulated audit request mock
      const mockReq = {
        user: { id: payment.studentId },
        ip: req.ip || '127.0.0.1',
        headers: { 'user-agent': 'Razorpay-Webhook' }
      };
      await auditLog('webhook_payment_processed', mockReq, 'Payment', payment._id, null, payment.toObject(), session);

      return { payment, ledger, duplicate: false };
    });

    res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });

    // Send notifications background
    if (!result.duplicate) {
      setImmediate(async () => {
        try {
          const student = await User.findById(result.payment.studentId);
          await notificationService.notify(student, 'payment_success', {
            amount: result.payment.amount,
            courseName: result.ledger?.title || 'Batch Tuition Fee',
            receiptId: result.payment.utrNumber
          });
        } catch (err) {
          console.error('Webhook notification dispatch failed:', err.message);
        }
      });
    }

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    await releaseLock(lockKey, ownerToken);
  }
};
